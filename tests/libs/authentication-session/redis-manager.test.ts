import {
    describe,
    it,
    vi,
} from 'vitest';

import {
    createClient,
    createManager,
    createStoredSessionRow,
    expectedRedisAuthenticationSessionKeyPrefix,
} from './_fixtures';

describe.concurrent('redis authentication session manager', () => {
    it('uses typed Redis methods to read all active sessions', async ({ expect }) => {
        const client = createClient({
            get: vi.fn().mockResolvedValue('epoch'),
            hmget: vi.fn().mockResolvedValue(createStoredSessionRow()),
            zrange: vi.fn().mockResolvedValue(['selector']),
        });

        const manager = createManager(client);

        const result = await manager.list({
            currentSessionId: 'selector',
            now: 15_000,
            principalId: 'admin-id',
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            id: 'selector',
            isCurrent: true,
            lastActiveAt: 10_000,
            lastActiveIp: '127.0.0.1',
            loggedAt: 9_000,
            loginIp: '127.0.0.1',
            userAgent: undefined,
        });

        expect(client.zrange).toHaveBeenCalledWith(
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessions:admin:admin-id:epoch`,
            '+inf',
            '(15000',
            'BYSCORE',
            'REV',
        );

        expect(client.send).not.toHaveBeenCalled();
    });

    it('lists the current session first and remaining sessions by recent activity', async ({ expect }) => {
        const sessions = {
            'current': createStoredSessionRow({
                id: 'current',
                lastActiveAt: 1_000,
                loggedAt: 500,
            }),
            'newest': createStoredSessionRow({
                id: 'newest',
                lastActiveAt: 12_000,
                loggedAt: 500,
            }),
            'older': createStoredSessionRow({
                id: 'older',
                lastActiveAt: 4_000,
                loggedAt: 500,
            }),
            'same-a': createStoredSessionRow({
                id: 'same-a',
                lastActiveAt: 8_000,
                loggedAt: 1_000,
            }),
            'same-b': createStoredSessionRow({
                id: 'same-b',
                lastActiveAt: 8_000,
                loggedAt: 1_000,
            }),
        };

        const client = createClient({
            get: vi.fn().mockResolvedValue('epoch'),
            hmget: vi.fn((key) => Promise.resolve(sessions[key.split(':').at(-1) as keyof typeof sessions])),
            zrange: vi.fn().mockResolvedValue([
                'older',
                'same-b',
                'current',
                'newest',
                'same-a',
            ]),
        });

        const result = await createManager(client).list({
            currentSessionId: 'current',
            now: 15_000,
            principalId: 'admin-id',
        });

        expect(result.map(({ id }) => id)).toEqual([
            'current',
            'newest',
            'same-a',
            'same-b',
            'older',
        ]);
    });

    it('bounds concurrent Redis reads while listing all active sessions', async ({ expect }) => {
        let activeReads = 0;
        let maximumActiveReads = 0;
        const selectors = Array.from({ length: 101 }, (_, index) => `selector-${index}`);
        const client = createClient({
            get: vi.fn().mockResolvedValue('epoch'),
            hmget: vi.fn(async () => {
                activeReads += 1;
                maximumActiveReads = Math.max(maximumActiveReads, activeReads);
                await new Promise<void>((resolve) => {
                    queueMicrotask(resolve);
                });
                activeReads -= 1;
                return [];
            }),
            zrange: vi.fn().mockResolvedValue(selectors),
        });

        const manager = createManager(client);

        const result = await manager.list({
            now: 15_000,
            principalId: 'admin-id',
        });

        expect(result).toHaveLength(0);
        expect(maximumActiveReads).toBe(100);
        expect(vi.mocked(client.zrem).mock.calls.map((args) => args.slice(1).length)).toEqual([
            100,
            1,
        ]);
    });

    it('returns an empty list without an epoch and removes stale index members', async ({ expect }) => {
        const emptyManager = createManager();

        await expect(emptyManager.list({ principalId: 'admin-id' })).resolves.toEqual([]);

        const zrem = vi.fn().mockResolvedValue(3);
        const client = createClient({
            get: vi.fn().mockResolvedValue('epoch'),
            hmget: vi.fn((key) => {
                const selector = key.split(':').at(-1);
                if (selector === 'missing') return Promise.resolve([]);
                if (selector === 'expired') {
                    return Promise.resolve(createStoredSessionRow({
                        absoluteExpiresAt: 15_000,
                        id: selector,
                    }));
                }

                return Promise.resolve(createStoredSessionRow({
                    epoch: 'old-epoch',
                    id: selector,
                }));
            }),
            zrange: vi.fn().mockResolvedValue([
                'missing',
                'expired',
                'wrong-epoch',
            ]),
            zrem,
        });

        const manager = createManager(client);

        await expect(
            manager.list({
                now: 15_000,
                principalId: 'admin-id',
            }),
        ).resolves.toEqual([]);

        expect(zrem).toHaveBeenCalledWith(
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessions:admin:admin-id:epoch`,
            'missing',
            'expired',
            'wrong-epoch',
        );
    });

    it('does not return sessions revoked while the list is being read', async ({ expect }) => {
        const client = createClient({
            get: vi.fn()
                .mockResolvedValueOnce('epoch')
                .mockResolvedValueOnce(null),
            hmget: vi.fn().mockResolvedValue(createStoredSessionRow()),
            zrange: vi.fn().mockResolvedValue(['selector']),
        });

        await expect(
            createManager(client).list({
                now: 15_000,
                principalId: 'admin-id',
            }),
        ).resolves.toEqual([]);
    });

    it('revokes a session using its stored principal', async ({ expect }) => {
        const hmget = vi.fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                'epoch',
                'admin-id',
            ]);

        const send = vi.fn().mockResolvedValue(1);
        const manager = createManager(
            createClient({
                hmget,
                send,
            }),
        );

        await expect(manager.revoke('missing')).resolves.toBe(false);
        await expect(manager.revoke('selector')).resolves.toBe(true);
        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0]?.[1]).toContain(
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessions:admin:admin-id:epoch`,
        );
    });

    it('deletes the epoch atomically before cleaning revoked session indexes', async ({ expect }) => {
        const get = vi.fn().mockResolvedValue(null);
        const send = vi.fn().mockResolvedValueOnce('old-epoch').mockResolvedValueOnce(2);
        const manager = createManager(
            createClient({
                get,
                send,
            }),
        );

        await manager.revokeAll('admin-id');

        expect(get).not.toHaveBeenCalled();
        expect(send.mock.calls.map(([command]) => command)).toEqual([
            'EVALSHA',
            'UNLINK',
        ]);

        expect(send.mock.calls[0]).toEqual([
            'EVALSHA',
            [
                expect.any(String),
                '1',
                `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessionEpoch:admin:admin-id`,
            ],
        ]);

        expect(send.mock.calls[1]).toEqual([
            'UNLINK',
            [`${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessions:admin:admin-id:old-epoch`],
        ]);
    });

    it('does not unlink an index when no previous epoch exists', async ({ expect }) => {
        const send = vi.fn().mockResolvedValue('');
        const manager = createManager(createClient({ send }));

        await manager.revokeAll('admin-id');
        expect(send).toHaveBeenCalledTimes(1);
    });
});
