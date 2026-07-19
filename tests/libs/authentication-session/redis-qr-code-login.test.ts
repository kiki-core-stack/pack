import { Buffer } from 'node:buffer';

import {
    describe,
    it,
    vi,
} from 'vitest';

import {
    createAuthenticationSessionData,
    createClient,
    createStore,
    expectedRedisAuthenticationSessionKeyPrefix,
} from './_fixtures';

const sourceSession = createAuthenticationSessionData({
    absoluteExpiresAt: Date.now() + 60 * 60 * 1000,
    id: 'source-selector',
});

describe.concurrent('redis authentication session QR code login', () => {
    it('creates separate approval and completion bearer tokens for one request', async ({ expect }) => {
        const send = vi.fn().mockResolvedValue('61000');
        const store = createStore(createClient({ send }));
        const created = await store.qrCodeLogin.create({
            ip: '192.0.2.10',
            userAgent: 'target-agent',
        });

        expect(created).toMatchObject({ expiresAt: 61_000 });
        expect(created.approvalToken).not.toBe(created.completionToken);

        const approvalBytes = Buffer.from(created.approvalToken, 'base64url');
        const completionBytes = Buffer.from(created.completionToken, 'base64url');
        expect(approvalBytes).toHaveLength(48);
        expect(completionBytes).toHaveLength(48);
        expect(approvalBytes.subarray(0, 16)).toEqual(completionBytes.subarray(0, 16));
        expect(approvalBytes.subarray(16)).not.toEqual(completionBytes.subarray(16));

        const scriptArguments = send.mock.calls[0]?.[1] as string[];
        expect(scriptArguments).toEqual([
            expect.any(String),
            '1',
            // eslint-disable-next-line style/max-len
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessionQrCodeLogin:admin:${approvalBytes.subarray(0, 16).toString('base64url')}`,
            expect.any(String),
            '192.0.2.10',
            'target-agent',
            expect.any(String),
            '60',
        ]);
    });

    it('keeps approval and completion token capabilities separate', async ({ expect }) => {
        const send = vi.fn().mockResolvedValue('61000');
        const hmget = vi.fn();
        const store = createStore(
            createClient({
                hmget,
                send,
            }),
        );

        const created = await store.qrCodeLogin.create({ ip: '192.0.2.10' });
        const createArguments = send.mock.calls[0]?.[1] as string[];
        const row = [
            createArguments[3],
            '61000',
            'pending',
            '192.0.2.10',
            null,
            createArguments[6],
            null,
            null,
            null,
            null,
            null,
            null,
        ];

        hmget.mockResolvedValue(row);

        await expect(store.qrCodeLogin.getApprovalRequest(created.approvalToken)).resolves.toEqual({
            expiresAt: 61_000,
            state: 'pending',
            targetIp: '192.0.2.10',
            targetUserAgent: undefined,
        });

        await expect(store.qrCodeLogin.getApprovalRequest(created.completionToken)).resolves.toBeUndefined();
        await expect(
            store.qrCodeLogin.complete({
                completionToken: created.completionToken,
                ip: '192.0.2.10',
                validatePrincipal: vi.fn(),
            }),
        ).resolves.toEqual({ state: 'pending' });

        await expect(
            store.qrCodeLogin.complete({
                completionToken: created.approvalToken,
                ip: '192.0.2.10',
                validatePrincipal: vi.fn(),
            }),
        ).resolves.toBeUndefined();
    });

    it('binds approval to the authenticated source session', async ({ expect }) => {
        const send = vi.fn()
            .mockResolvedValueOnce('61000')
            .mockResolvedValueOnce(1);

        const store = createStore(createClient({ send }));
        const created = await store.qrCodeLogin.create({ ip: '192.0.2.10' });

        await expect(
            store.qrCodeLogin.approve({
                approvalToken: created.approvalToken,
                sourceSession,
            }),
        ).resolves.toBe(true);

        const approvalArguments = send.mock.calls[1]?.[1] as string[];
        expect(approvalArguments.slice(1, 4)).toEqual([
            '3',
            expect.stringContaining('authenticationSessionQrCodeLogin:admin:'),
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSession:admin:${sourceSession.id}`,
        ]);

        expect(approvalArguments).toContain(
            // eslint-disable-next-line style/max-len
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessionEpoch:admin:${sourceSession.principalId}`,
        );
    });

    it('validates the principal before atomically issuing a new target session', async ({ expect }) => {
        const send = vi.fn()
            .mockResolvedValueOnce('61000')
            .mockResolvedValueOnce([
                '13',
                '0',
            ])
            .mockResolvedValueOnce([
                2_592_000,
                13_000,
            ]);

        const hmget = vi.fn();
        const store = createStore(
            createClient({
                hmget,
                send,
            }),
        );

        const created = await store.qrCodeLogin.create({
            ip: '192.0.2.10',
            userAgent: 'target-agent',
        });

        const createArguments = send.mock.calls[0]?.[1] as string[];
        hmget.mockResolvedValue([
            createArguments[3],
            '61000',
            'approved',
            '192.0.2.10',
            'target-agent',
            createArguments[6],
            '12000',
            String(sourceSession.principalAuthenticationRevision),
            sourceSession.principalId,
            sourceSession.principalType,
            sourceSession.epoch,
            sourceSession.id,
        ]);

        await expect(store.qrCodeLogin.getApprovalRequest(created.approvalToken)).resolves.toEqual({
            expiresAt: 12_000,
            state: 'approved',
            targetIp: '192.0.2.10',
            targetUserAgent: 'target-agent',
        });

        const validatePrincipal = vi.fn().mockResolvedValue(true);
        const completed = await store.qrCodeLogin.complete({
            completionToken: created.completionToken,
            ip: '192.0.2.20',
            userAgent: 'consuming-agent',
            validatePrincipal,
        });

        const completionArguments = send.mock.calls[2]?.[1] as string[];
        const targetAbsoluteExpiresAt = Number(completionArguments[13]);

        expect(validatePrincipal).toHaveBeenCalledWith({
            principalAuthenticationRevision: sourceSession.principalAuthenticationRevision,
            principalId: sourceSession.principalId,
            principalType: sourceSession.principalType,
        });

        expect(completed).toMatchObject({
            cookieMaxAgeSeconds: 2_592_000,
            session: {
                absoluteExpiresAt: expect.any(Number),
                epoch: sourceSession.epoch,
                lastActiveIp: '192.0.2.20',
                loggedAt: 13_000,
                loginIp: '192.0.2.20',
                principalAuthenticationRevision: sourceSession.principalAuthenticationRevision,
                principalId: sourceSession.principalId,
                principalType: sourceSession.principalType,
                userAgent: 'consuming-agent',
            },
            state: 'completed',
            token: expect.any(String),
        });

        expect(send.mock.calls[1]).toEqual([
            'TIME',
            [],
        ]);

        expect(targetAbsoluteExpiresAt).toBe(13_000 + 60 * 60 * 24 * 30 * 1000);
        expect(completed?.state === 'completed' && completed.session.absoluteExpiresAt)
            .toBe(targetAbsoluteExpiresAt);

        expect(completionArguments).toEqual([
            expect.any(String),
            '5',
            expect.stringContaining('authenticationSessionQrCodeLogin:admin:'),
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSession:admin:${sourceSession.id}`,
            // eslint-disable-next-line style/max-len
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessionEpoch:admin:${sourceSession.principalId}`,
            expect.stringContaining('authenticationSession:admin:'),
            // eslint-disable-next-line style/max-len
            `${expectedRedisAuthenticationSessionKeyPrefix}authenticationSessions:admin:${sourceSession.principalId}:${sourceSession.epoch}`,
            expect.any(String),
            sourceSession.id,
            sourceSession.epoch,
            String(sourceSession.principalAuthenticationRevision),
            sourceSession.principalId,
            sourceSession.principalType,
            expect.any(String),
            String(60 * 60 * 24 * 7),
            expect.any(String),
            '192.0.2.20',
            'consuming-agent',
            expect.any(String),
        ]);
    });

    it('does not run the complete script when authoritative validation fails', async ({ expect }) => {
        const send = vi.fn().mockResolvedValueOnce('61000');
        const hmget = vi.fn();
        const store = createStore(
            createClient({
                hmget,
                send,
            }),
        );

        const created = await store.qrCodeLogin.create({ ip: '192.0.2.10' });
        const createArguments = send.mock.calls[0]?.[1] as string[];

        hmget.mockResolvedValue([
            createArguments[3],
            '61000',
            'approved',
            '192.0.2.10',
            null,
            createArguments[6],
            '12000',
            String(sourceSession.principalAuthenticationRevision),
            sourceSession.principalId,
            sourceSession.principalType,
            sourceSession.epoch,
            sourceSession.id,
        ]);

        await expect(
            store.qrCodeLogin.complete({
                completionToken: created.completionToken,
                ip: '192.0.2.10',
                validatePrincipal: vi.fn().mockResolvedValue(false),
            }),
        ).resolves.toBeUndefined();

        expect(send).toHaveBeenCalledTimes(1);
    });

    it('rejects malformed tokens without reading or mutating Redis', async ({ expect }) => {
        const client = createClient();
        const store = createStore(client);

        await expect(store.qrCodeLogin.getApprovalRequest('invalid')).resolves.toBeUndefined();
        await expect(
            store.qrCodeLogin.approve({
                approvalToken: 'invalid',
                sourceSession,
            }),
        ).resolves.toBe(false);

        await expect(
            store.qrCodeLogin.complete({
                completionToken: 'invalid',
                ip: '192.0.2.10',
                validatePrincipal: vi.fn(),
            }),
        ).resolves.toBeUndefined();

        expect(client.hmget).not.toHaveBeenCalled();
        expect(client.send).not.toHaveBeenCalled();
    });
});
