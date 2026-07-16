import {
    describe,
    it,
    vi,
} from 'vitest';

import { authenticationSessionIdleTtlSeconds } from '../../../src/constants/authentication-session';
import { generateAuthenticationSessionToken } from '../../../src/libs/authentication-session';
import {
    createRedisAuthenticationSessionManager,
    createRedisAuthenticationSessionStore,
    getRedisAuthenticationSessionEpochKey,
    getRedisAuthenticationSessionIndexKey,
    getRedisAuthenticationSessionKey,
} from '../../../src/libs/authentication-session/redis-store';
import type {
    RedisAuthenticationSessionManagerOptions,
    RedisAuthenticationSessionStoreOptions,
} from '../../../src/libs/authentication-session/redis-store';
import {
    createAuthenticationSessionScript,
    createRedisScript,
    finalizeAuthenticationSessionScript,
    rotateAuthenticationSessionScript,
} from '../../../src/libs/authentication-session/redis-store/_internals';
import type { AuthenticationSessionData } from '../../../src/types/data/authentication-session';

// Types
type RedisAuthenticationSessionClient = RedisAuthenticationSessionManagerOptions['client'];
type StoredAuthenticationSessionData = AuthenticationSessionData & { validatorDigest: string };

// Constants
const tokenHmacKey = 'a-secure-test-only-token-hmac-key-with-more-than-32-bytes';

// Functions
function createClient(overrides: Partial<RedisAuthenticationSessionClient> = {}): RedisAuthenticationSessionClient {
    return {
        get: vi.fn().mockResolvedValue(null),
        hmget: vi.fn().mockResolvedValue([]),
        send: vi.fn().mockResolvedValue(undefined),
        zrange: vi.fn().mockResolvedValue([]),
        zrem: vi.fn().mockResolvedValue(0),
        ...overrides,
    };
}

function createManager(
    client = createClient(),
    options: Omit<RedisAuthenticationSessionManagerOptions, 'client' | 'principalType'> = {},
) {
    return createRedisAuthenticationSessionManager({
        ...options,
        client,
        principalType: 'admin',
    });
}

function createStore(
    client = createClient(),
    options: Omit<RedisAuthenticationSessionStoreOptions, 'client' | 'principalType' | 'tokenHmacKey'> = {},
) {
    return createRedisAuthenticationSessionStore({
        ...options,
        client,
        principalType: 'admin',
        tokenHmacKey,
    });
}

function createStoredSessionRow(overrides: Partial<StoredAuthenticationSessionData> = {}): (null | string)[] {
    const session: StoredAuthenticationSessionData = {
        absoluteExpiresAt: 20_000,
        epoch: 'epoch',
        id: 'selector',
        lastActiveAt: 10_000,
        lastActiveIp: '127.0.0.1',
        loggedAt: 9_000,
        loginIp: '127.0.0.1',
        principalId: 'admin-id',
        principalType: 'admin',
        validatorDigest: 'digest',
        ...overrides,
    };

    return [
        String(session.absoluteExpiresAt),
        session.epoch,
        session.id,
        String(session.lastActiveAt),
        session.lastActiveIp,
        String(session.loggedAt),
        session.loginIp,
        session.principalId,
        session.principalType,
        session.userAgent ?? null,
        session.validatorDigest,
    ];
}

// Tests
describe.concurrent('redis authentication session store', () => {
    it('bounds authentication session indexes by expiration and TTL', ({ expect }) => {
        for (
            const script of [
                createAuthenticationSessionScript,
                finalizeAuthenticationSessionScript,
                rotateAuthenticationSessionScript,
            ]
        ) {
            expect(script).toContain('redis.call(\'ZRANGEBYSCORE\'');
            expect(script).toContain('\'LIMIT\', 0, 256');
            expect(script).toContain('redis.call(\'TTL\'');
        }
    });

    it('builds admin authentication session keys', ({ expect }) => {
        expect(getRedisAuthenticationSessionKey('admin', 'selector', 'test:'))
            .toBe('test:authenticationSession:admin:selector');

        expect(getRedisAuthenticationSessionEpochKey('admin', 'admin-id'))
            .toBe('authenticationSessionEpoch:admin:admin-id');

        expect(getRedisAuthenticationSessionIndexKey('admin', 'admin-id', 'epoch'))
            .toBe('authenticationSessions:admin:admin-id:epoch');
    });

    it('does not run Redis scripts for malformed or digest-mismatched tokens', async ({ expect }) => {
        const client = createClient();
        const store = createStore(client);

        await expect(
            store.authenticate({
                ip: '127.0.0.1',
                token: 'invalid',
            }),
        )
            .resolves
            .toBeUndefined();

        expect(client.hmget).not.toHaveBeenCalled();
        expect(client.send).not.toHaveBeenCalled();

        const generated = generateAuthenticationSessionToken('admin', tokenHmacKey);
        const digestMismatchClient = createClient({
            hmget: vi.fn().mockResolvedValue(createStoredSessionRow({
                id: generated.selector,
                validatorDigest: 'invalid-digest',
            })),
        });

        const digestMismatchStore = createStore(digestMismatchClient);

        await expect(
            digestMismatchStore.authenticate({
                ip: '127.0.0.1',
                token: generated.token,
            }),
        )
            .resolves
            .toBeUndefined();

        expect(digestMismatchClient.send).not.toHaveBeenCalled();
    });

    it('loads a missing script before retrying session creation', async ({ expect }) => {
        const send = vi.fn()
            .mockRejectedValueOnce(new Error('NOSCRIPT No matching script'))
            .mockResolvedValueOnce('sha')
            .mockResolvedValueOnce('epoch')
            .mockResolvedValueOnce(1);

        const store = createStore(createClient({ send }), { keyPrefix: 'test:' });

        const created = await store.create({
            ip: '127.0.0.1',
            now: 1_000,
            principalId: 'admin-id',
        });

        expect(created.session).toMatchObject({
            absoluteExpiresAt: 2_592_001_000,
            epoch: 'epoch',
            lastActiveAt: 1_000,
            principalId: 'admin-id',
            principalType: 'admin',
        });

        expect(send.mock.calls.map(([command]) => command)).toEqual([
            'EVALSHA',
            'SCRIPT',
            'EVALSHA',
            'EVALSHA',
        ]);

        expect(send.mock.calls[1]).toEqual([
            'SCRIPT',
            expect.arrayContaining(['LOAD']),
        ]);

        expect(send.mock.calls[3]?.[1].at(-1)).toBe(String(1_000 + authenticationSessionIdleTtlSeconds * 1000));
    });

    it('shares one script load between concurrent callers', async ({ expect }) => {
        let loaded = false;
        const send = vi.fn(async (command: string) => {
            if (command === 'SCRIPT') {
                await new Promise<void>((resolve) => void queueMicrotask(resolve));
                loaded = true;
                return 'sha';
            }

            if (!loaded) throw new Error('NOSCRIPT No matching script');
            return 1;
        });

        const execute = createRedisScript({ send }, 'return 1');

        await expect(Promise.all([
            execute([], []),
            execute([], []),
        ])).resolves.toEqual([
            1,
            1,
        ]);

        expect(send.mock.calls.filter(([command]) => command === 'SCRIPT')).toHaveLength(1);
    });

    it('preserves Redis errors unrelated to missing scripts', async ({ expect }) => {
        const error = new Error('Redis unavailable');
        const execute = createRedisScript({ send: vi.fn().mockRejectedValue(error) }, 'return 1');

        await expect(execute([], [])).rejects.toBe(error);
    });

    it('fails session creation when its epoch changes', async ({ expect }) => {
        const store = createStore(
            createClient({ send: vi.fn().mockResolvedValueOnce('epoch').mockResolvedValueOnce(0) }),
        );

        await expect(
            store.create({
                ip: '127.0.0.1',
                principalId: 'admin-id',
            }),
        )
            .rejects
            .toThrow('authentication session epoch changed during creation');
    });

    it('rejects an invalid token HMAC key when creating the store', ({ expect }) => {
        for (
            const invalidTokenHmacKey of [
                'short',
                new Uint8Array(31),
            ]
        ) {
            expect(
                () => createRedisAuthenticationSessionStore({
                    client: createClient(),
                    principalType: 'admin',
                    tokenHmacKey: invalidTokenHmacKey,
                }),
            ).toThrow(TypeError);
        }
    });

    it('returns authentication activity only when Redis touches the session', async ({ expect }) => {
        const generated = generateAuthenticationSessionToken('admin', tokenHmacKey);
        const send = vi.fn()
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(0);

        const store = createStore(
            createClient({
                hmget: vi.fn().mockResolvedValue(createStoredSessionRow({
                    id: generated.selector,
                    lastActiveAt: 9_000,
                    validatorDigest: generated.validatorDigest,
                })),
                send,
            }),
            {
                idleTtlSeconds: 100,
                touchIntervalSeconds: 5,
            },
        );

        await expect(
            store.authenticate({
                ip: '127.0.0.2',
                now: 10_000,
                token: generated.token,
            }),
        )
            .resolves
            .toEqual({ session: expect.objectContaining({ lastActiveAt: 9_000 }) });

        await expect(
            store.authenticate({
                ip: '127.0.0.3',
                now: 15_000,
                token: generated.token,
            }),
        )
            .resolves
            .toEqual({
                refreshedTtlSeconds: 5,
                session: expect.objectContaining({
                    lastActiveAt: 15_000,
                    lastActiveIp: '127.0.0.3',
                }),
            });

        await expect(
            store.authenticate({
                ip: '127.0.0.4',
                now: 16_000,
                token: generated.token,
            }),
        )
            .resolves
            .toBeUndefined();
    });

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
        expect(result[0]).toMatchObject({
            id: 'selector',
            isCurrent: true,
            principalId: 'admin-id',
            principalType: 'admin',
        });

        expect(client.zrange).toHaveBeenCalledWith(
            'authenticationSessions:admin:admin-id:epoch',
            '+inf',
            '(15000',
            'BYSCORE',
            'REV',
        );

        expect(client.send).not.toHaveBeenCalled();
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
        )
            .resolves
            .toEqual([]);

        expect(zrem).toHaveBeenCalledWith(
            'authenticationSessions:admin:admin-id:epoch',
            'missing',
            'expired',
            'wrong-epoch',
        );
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

        await expect(manager.revoke('missing'))
            .resolves
            .toBe(false);

        await expect(manager.revoke('selector'))
            .resolves
            .toBe(true);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0]?.[1]).toContain('authenticationSessions:admin:admin-id:epoch');
    });

    it('rotates the epoch atomically before cleaning revoked session indexes', async ({ expect }) => {
        const get = vi.fn().mockResolvedValue(null);
        const send = vi.fn().mockResolvedValueOnce('old-epoch').mockResolvedValueOnce(2);
        const manager = createManager(
            createClient({
                get,
                send,
            }),
            { keyPrefix: 'test:' },
        );

        await manager.revokeAll('admin-id');

        expect(get).not.toHaveBeenCalled();
        expect(send.mock.calls.map(([command]) => command)).toEqual([
            'EVALSHA',
            'UNLINK',
        ]);

        expect(send.mock.calls[1]).toEqual([
            'UNLINK',
            ['test:authenticationSessions:admin:admin-id:old-epoch'],
        ]);
    });

    it('does not unlink an index when no previous epoch exists', async ({ expect }) => {
        const send = vi.fn().mockResolvedValue('');
        const manager = createManager(createClient({ send }));

        await manager.revokeAll('admin-id');
        expect(send).toHaveBeenCalledTimes(1);
    });

    it('preserves the absolute lifetime and login metadata when rotating a token', async ({ expect }) => {
        const generated = generateAuthenticationSessionToken('admin', tokenHmacKey);
        const send = vi.fn().mockResolvedValue(1);
        const store = createStore(
            createClient({
                hmget: vi.fn().mockResolvedValue(createStoredSessionRow({
                    id: generated.selector,
                    lastActiveAt: 9_000,
                    loggedAt: 1_000,
                    loginIp: '127.0.0.2',
                    userAgent: 'old-agent',
                    validatorDigest: generated.validatorDigest,
                })),
                send,
            }),
            {
                absoluteTtlSeconds: 30,
                idleTtlSeconds: 100,
            },
        );

        const rotated = await store.rotate({
            ip: '127.0.0.3',
            now: 10_000,
            principalId: 'admin-id',
            token: generated.token,
        });

        expect(rotated).toMatchObject({
            session: {
                absoluteExpiresAt: 20_000,
                lastActiveAt: 10_000,
                lastActiveIp: '127.0.0.3',
                loggedAt: 1_000,
                loginIp: '127.0.0.2',
                userAgent: 'old-agent',
            },
            ttlSeconds: 10,
        });

        expect(send).toHaveBeenCalledTimes(2);
    });

    it('does not rotate another principal session or a session changed concurrently', async ({ expect }) => {
        const generated = generateAuthenticationSessionToken('admin', tokenHmacKey);
        const otherPrincipalSend = vi.fn().mockResolvedValue(1);
        const otherPrincipalStore = createStore(
            createClient({
                hmget: vi.fn().mockResolvedValue(createStoredSessionRow({
                    id: generated.selector,
                    principalId: 'another-admin',
                    validatorDigest: generated.validatorDigest,
                })),
                send: otherPrincipalSend,
            }),
        );

        await expect(
            otherPrincipalStore.rotate({
                ip: '127.0.0.1',
                principalId: 'admin-id',
                token: generated.token,
            }),
        )
            .resolves
            .toBeUndefined();

        expect(otherPrincipalSend).toHaveBeenCalledTimes(1);

        const changedSessionSend = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0);
        const changedSessionStore = createStore(
            createClient({
                hmget: vi.fn().mockResolvedValue(createStoredSessionRow({
                    id: generated.selector,
                    validatorDigest: generated.validatorDigest,
                })),
                send: changedSessionSend,
            }),
        );

        await expect(
            changedSessionStore.rotate({
                ip: '127.0.0.1',
                principalId: 'admin-id',
                token: generated.token,
            }),
        )
            .resolves
            .toBeUndefined();

        expect(changedSessionSend).toHaveBeenCalledTimes(2);
    });
});
