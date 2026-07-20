import {
    describe,
    it,
    vi,
} from 'vitest';

import { createRedisAuthenticationSessionStore } from '../../../src/libs/authentication-session/redis-store';

import {
    createClient,
    createManager,
    createStore,
    createStoredSessionRow,
    expectedRedisAuthenticationSessionKeyPrefix,
    generateStoredSessionToken,
    validatePrincipal,
} from './_fixtures';

const expectedDefaultIdleTtlSeconds = 60 * 60 * 24 * 7;

describe.concurrent('redis authentication session store', () => {
    it('does not run Redis scripts for malformed or digest-mismatched tokens', async ({ expect }) => {
        const client = createClient();
        const store = createStore(client);

        await expect(
            store.authenticate({
                ip: '127.0.0.1',
                token: 'invalid',
                validatePrincipal,
            }),
        ).resolves.toBeUndefined();

        expect(client.hmget).not.toHaveBeenCalled();
        expect(client.send).not.toHaveBeenCalled();

        const generated = generateStoredSessionToken();
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
                validatePrincipal,
            }),
        ).resolves.toBeUndefined();

        expect(digestMismatchClient.send).not.toHaveBeenCalled();
    });

    it('requires the authoritative principal to accept the stored authentication revision', async ({ expect }) => {
        const generated = generateStoredSessionToken({ principalAuthenticationRevision: 7 });
        const validateStoredPrincipal = vi.fn().mockResolvedValue(false);
        const send = vi.fn();
        const store = createStore(createClient({
            hmget: vi.fn().mockResolvedValue(createStoredSessionRow({
                id: generated.selector,
                principalAuthenticationRevision: 7,
                validatorDigest: generated.validatorDigest,
            })),
            send,
        }));

        await expect(
            store.authenticate({
                ip: '127.0.0.1',
                now: 10_000,
                token: generated.token,
                validatePrincipal: validateStoredPrincipal,
            }),
        ).resolves.toBeUndefined();

        expect(validateStoredPrincipal).toHaveBeenCalledWith(expect.objectContaining({
            principalAuthenticationRevision: 7,
            principalId: 'admin-id',
        }));

        expect(send).not.toHaveBeenCalled();
    });

    it('rejects authentication when revokeAll linearizes after principal validation', async ({ expect }) => {
        const generated = generateStoredSessionToken();
        const send = vi.fn()
            .mockResolvedValueOnce('epoch')
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(0);

        const client = createClient({
            hmget: vi.fn().mockResolvedValue(createStoredSessionRow({
                id: generated.selector,
                validatorDigest: generated.validatorDigest,
            })),
            send,
        });

        const manager = createManager(client);
        const store = createStore(client);

        await expect(
            store.authenticate({
                ip: '127.0.0.1',
                now: 10_000,
                token: generated.token,
                validatePrincipal: async () => {
                    await manager.revokeAll('admin-id');
                    return true;
                },
            }),
        ).resolves.toBeUndefined();

        expect(send.mock.calls.map(([command]) => command)).toEqual([
            'EVALSHA',
            'UNLINK',
            'EVALSHA',
        ]);
    });

    it('rejects malformed stored sessions before principal validation', async ({ expect }) => {
        const generated = generateStoredSessionToken();
        for (
            const [fieldIndex, invalidValue] of [
                [
                    0,
                    'invalid',
                ],
                [
                    2,
                    null,
                ],
                [
                    3,
                    'invalid',
                ],
                [
                    7,
                    null,
                ],
                [
                    7,
                    '-1',
                ],
                [
                    7,
                    '1.5',
                ],
                [
                    7,
                    String(Number.MAX_SAFE_INTEGER + 1),
                ],
                [
                    10,
                    null,
                ],
            ] as const
        ) {
            const storedSession = createStoredSessionRow({
                id: generated.selector,
                validatorDigest: generated.validatorDigest,
            });

            storedSession[fieldIndex] = invalidValue;
            const validateStoredPrincipal = vi.fn().mockResolvedValue(true);
            const store = createStore(createClient({ hmget: vi.fn().mockResolvedValue(storedSession) }));

            await expect(
                store.authenticate({
                    ip: '127.0.0.1',
                    now: 10_000,
                    token: generated.token,
                    validatePrincipal: validateStoredPrincipal,
                }),
            ).resolves.toBeUndefined();

            expect(validateStoredPrincipal).not.toHaveBeenCalled();
        }
    });

    it('loads a missing script before retrying session creation', async ({ expect }) => {
        const send = vi.fn()
            .mockRejectedValueOnce(new Error('NOSCRIPT No matching script'))
            .mockResolvedValueOnce('sha')
            .mockResolvedValueOnce('epoch')
            .mockResolvedValueOnce(1);

        const store = createStore(createClient({ send }));

        const created = await store.create({
            ip: '127.0.0.1',
            now: 1_000,
            principalAuthenticationRevision: 3,
            principalId: 'admin-id',
        });

        expect(created.session).toMatchObject({
            absoluteExpiresAt: 2_592_001_000,
            epoch: 'epoch',
            lastActiveAt: 1_000,
            principalAuthenticationRevision: 3,
            principalId: 'admin-id',
            principalType: 'admin',
        });

        expect(created.cookieMaxAgeSeconds).toBe(2_592_000);

        expect(send.mock.calls[3]?.[1]).toEqual([
            expect.any(String),
            '3',
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSession:admin:${created.session.id}`,
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessionEpoch:admin:admin-id`,
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessions:admin:admin-id:epoch`,
            'epoch',
            '2592001000',
            created.session.id,
            '1000',
            '127.0.0.1',
            '3',
            'admin-id',
            '',
            expect.any(String),
            String(expectedDefaultIdleTtlSeconds),
            String(1_000 + expectedDefaultIdleTtlSeconds * 1000),
        ]);

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

        expect(send.mock.calls[2]?.[1]).toEqual([
            expect.any(String),
            '1',
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessionEpoch:admin:admin-id`,
            expect.any(String),
            '2592000',
        ]);

        expect(send.mock.calls[2]?.[1][3]).toMatch(/^[\w-]{43}$/);
    });

    it('fails session creation when its epoch changes', async ({ expect }) => {
        const store = createStore(
            createClient({ send: vi.fn().mockResolvedValueOnce('epoch').mockResolvedValueOnce(0) }),
        );

        await expect(
            store.create({
                ip: '127.0.0.1',
                principalAuthenticationRevision: 3,
                principalId: 'admin-id',
            }),
        ).rejects.toThrow('authentication session epoch changed during creation');
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

    it('rejects invalid authentication session durations', ({ expect }) => {
        for (
            const options of [
                { absoluteTtlSeconds: 0 },
                { absoluteTtlSeconds: Number.MAX_SAFE_INTEGER },
                { idleTtlSeconds: Number.NaN },
                { idleTtlSeconds: 1.5 },
                { touchIntervalSeconds: -1 },
                {
                    idleTtlSeconds: 10,
                    touchIntervalSeconds: 10,
                },
                { qrCodeLoginApprovalTtlSeconds: 0 },
                { qrCodeLoginRequestTtlSeconds: 1.5 },
                {
                    qrCodeLoginApprovalTtlSeconds: 11,
                    qrCodeLoginRequestTtlSeconds: 10,
                },
            ]
        ) {
            expect(() => createStore(createClient(), options)).toThrow(TypeError);
        }
    });

    it('rejects expired sessions before authoritative validation', async ({ expect }) => {
        for (
            const { rowOverrides, storeOptions } of [
                {
                    rowOverrides: { absoluteExpiresAt: 10_000 },
                    storeOptions: {},
                },
                {
                    rowOverrides: { lastActiveAt: 5_000 },
                    storeOptions: {
                        idleTtlSeconds: 5,
                        touchIntervalSeconds: 1,
                    },
                },
            ]
        ) {
            const generated = generateStoredSessionToken(rowOverrides);
            const validateStoredPrincipal = vi.fn().mockResolvedValue(true);
            const send = vi.fn();
            const store = createStore(
                createClient({
                    hmget: vi.fn().mockResolvedValue(createStoredSessionRow({
                        ...rowOverrides,
                        id: generated.selector,
                        validatorDigest: generated.validatorDigest,
                    })),
                    send,
                }),
                storeOptions,
            );

            await expect(
                store.authenticate({
                    ip: '127.0.0.1',
                    now: 10_000,
                    token: generated.token,
                    validatePrincipal: validateStoredPrincipal,
                }),
            ).resolves.toBeUndefined();

            expect(validateStoredPrincipal).not.toHaveBeenCalled();
            expect(send).not.toHaveBeenCalled();
        }
    });

    it('rejects an invalid principal authentication revision', async ({ expect }) => {
        const store = createStore();

        for (
            const principalAuthenticationRevision of [
                -1,
                1.5,
                Number.NaN,
            ]
        ) {
            await expect(
                store.create({
                    ip: '127.0.0.1',
                    principalAuthenticationRevision,
                    principalId: 'admin-id',
                }),
            ).rejects.toThrow(TypeError);
        }
    });

    it('returns authentication activity only when Redis touches the session', async ({ expect }) => {
        const generated = generateStoredSessionToken();
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
                validatePrincipal,
            }),
        ).resolves.toEqual(expect.objectContaining({ lastActiveAt: 9_000 }));

        await expect(
            store.authenticate({
                ip: '127.0.0.3',
                now: 15_000,
                token: generated.token,
                validatePrincipal,
            }),
        ).resolves.toEqual(
            expect.objectContaining({
                lastActiveAt: 15_000,
                lastActiveIp: '127.0.0.3',
            }),
        );

        await expect(
            store.authenticate({
                ip: '127.0.0.4',
                now: 16_000,
                token: generated.token,
                validatePrincipal,
            }),
        ).resolves.toBeUndefined();
    });

    it('preserves the absolute lifetime and login metadata when rotating a token', async ({ expect }) => {
        const generated = generateStoredSessionToken();
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
                idleTtlSeconds: 100,
                touchIntervalSeconds: 5,
            },
        );

        const rotated = await store.rotate({
            ip: '127.0.0.3',
            now: 10_000,
            principalId: 'admin-id',
            token: generated.token,
            validatePrincipal,
        });

        expect(rotated).toMatchObject({
            cookieMaxAgeSeconds: 10,
            session: {
                absoluteExpiresAt: 20_000,
                lastActiveAt: 10_000,
                lastActiveIp: '127.0.0.3',
                loggedAt: 1_000,
                loginIp: '127.0.0.2',
                principalAuthenticationRevision: 3,
                userAgent: 'old-agent',
            },
        });

        expect(send).toHaveBeenCalledTimes(2);
    });

    it('does not rotate another principal session or a session changed concurrently', async ({ expect }) => {
        const otherPrincipalGenerated = generateStoredSessionToken({ principalId: 'another-admin' });
        const otherPrincipalSend = vi.fn().mockResolvedValue(1);
        const otherPrincipalStore = createStore(
            createClient({
                hmget: vi.fn().mockResolvedValue(createStoredSessionRow({
                    id: otherPrincipalGenerated.selector,
                    principalId: 'another-admin',
                    validatorDigest: otherPrincipalGenerated.validatorDigest,
                })),
                send: otherPrincipalSend,
            }),
        );

        await expect(
            otherPrincipalStore.rotate({
                ip: '127.0.0.1',
                now: 10_000,
                principalId: 'admin-id',
                token: otherPrincipalGenerated.token,
                validatePrincipal,
            }),
        ).resolves.toBeUndefined();

        expect(otherPrincipalSend).toHaveBeenCalledTimes(1);

        const generated = generateStoredSessionToken();
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
                now: 10_000,
                principalId: 'admin-id',
                token: generated.token,
                validatePrincipal,
            }),
        ).resolves.toBeUndefined();

        expect(changedSessionSend).toHaveBeenCalledTimes(2);
    });
});
