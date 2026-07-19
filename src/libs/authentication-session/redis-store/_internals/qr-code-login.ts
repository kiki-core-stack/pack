import { Buffer } from 'node:buffer';
import {
    createHmac,
    randomBytes,
} from 'node:crypto';

import type {
    AuthenticationSessionPrincipalType,
    AuthenticationSessionQrCodeLoginStore,
} from '../../../../types/authentication-session';
import {
    generateAuthenticationSessionToken,
    parseAuthenticationSessionToken,
    tokenSelectorByteLength,
    tokenValidatorByteLength,
    verifyAuthenticationSessionTokenDigest,
} from '../../_token';
import type { ParsedAuthenticationSessionToken } from '../../_token';

import { createRedisAuthenticationSessionKeys } from './keys';
import { createRedisScriptRunner } from './script-runner';
import {
    approveAuthenticationSessionQrCodeLoginScript,
    cancelAuthenticationSessionQrCodeLoginScript,
    completeAuthenticationSessionQrCodeLoginScript,
    createAuthenticationSessionQrCodeLoginScript,
} from './scripts/qr-code-login';

// Types
type StoredAuthenticationSessionQrCodeLogin =
  | ApprovedStoredAuthenticationSessionQrCodeLogin
  | PendingStoredAuthenticationSessionQrCodeLogin;

interface ApprovedStoredAuthenticationSessionQrCodeLogin extends StoredAuthenticationSessionQrCodeLoginCommonData {
    approvalExpiresAt: number;
    principalAuthenticationRevision: number;
    principalId: string;
    principalType: AuthenticationSessionPrincipalType;
    sourceEpoch: string;
    sourceSessionId: string;
    state: 'approved';
}

interface AuthenticationSessionQrCodeLoginTokenPair {
    approvalToken: string;
    approvalValidatorDigest: string;
    completionToken: string;
    completionValidatorDigest: string;
    selector: string;
}

interface CreateRedisAuthenticationSessionQrCodeLoginStoreOptions {
    absoluteTtlSeconds: number;
    approvalTtlSeconds: number;
    client: Pick<Bun.RedisClient, 'hmget' | 'send'>;
    idleTtlSeconds: number;
    principalType: AuthenticationSessionPrincipalType;
    qrCodeLoginRequestTtlSeconds: number;
    tokenHmacKey: string | Uint8Array;
}

interface PendingStoredAuthenticationSessionQrCodeLogin extends StoredAuthenticationSessionQrCodeLoginCommonData {
    state: 'pending';
}

interface StoredAuthenticationSessionQrCodeLoginCommonData {
    approvalValidatorDigest: string;
    completionValidatorDigest: string;
    expiresAt: number;
    targetIp: string;
    targetUserAgent?: string;
}

// Constants
const storedAuthenticationSessionQrCodeLoginFields = [
    'approvalValidatorDigest',
    'expiresAt',
    'state',
    'targetIp',
    'targetUserAgent',
    'completionValidatorDigest',
    'approvalExpiresAt',
    'principalAuthenticationRevision',
    'principalId',
    'principalType',
    'sourceEpoch',
    'sourceSessionId',
] as const;

// Functions
export function createRedisAuthenticationSessionQrCodeLoginStore(
    options: CreateRedisAuthenticationSessionQrCodeLoginStoreOptions,
): AuthenticationSessionQrCodeLoginStore {
    const {
        absoluteTtlSeconds,
        approvalTtlSeconds,
        client,
        idleTtlSeconds,
        principalType,
        qrCodeLoginRequestTtlSeconds,
        tokenHmacKey,
    } = options;

    const keys = createRedisAuthenticationSessionKeys(principalType);
    const approveStoredRequest = createRedisScriptRunner<number>(client, approveAuthenticationSessionQrCodeLoginScript);
    const cancelStoredRequest = createRedisScriptRunner<number>(client, cancelAuthenticationSessionQrCodeLoginScript);
    const completeStoredRequest = createRedisScriptRunner<0 | [number, number]>(
        client,
        completeAuthenticationSessionQrCodeLoginScript,
    );

    const createStoredRequest = createRedisScriptRunner<string>(client, createAuthenticationSessionQrCodeLoginScript);

    // Functions
    async function create(input: Parameters<AuthenticationSessionQrCodeLoginStore['create']>[0]) {
        const generated = generateAuthenticationSessionQrCodeLoginTokenPair(principalType, tokenHmacKey);
        const expiresAt = Number(await createStoredRequest(
            [keys.qrCodeLogin(generated.selector)],
            [
                generated.approvalValidatorDigest,
                input.ip,
                input.userAgent ?? '',
                generated.completionValidatorDigest,
                qrCodeLoginRequestTtlSeconds,
            ],
        ));

        return {
            approvalToken: generated.approvalToken,
            completionToken: generated.completionToken,
            expiresAt,
        };
    }

    async function getApprovalRequest(approvalToken: string) {
        const parsedToken = parseAuthenticationSessionToken(approvalToken);
        if (!parsedToken) return;

        const request = parseStoredAuthenticationSessionQrCodeLogin(
            await client.hmget(keys.qrCodeLogin(parsedToken.selector), ...storedAuthenticationSessionQrCodeLoginFields),
            principalType,
        );

        if (
            !request
            || !verifyAuthenticationSessionQrCodeLoginToken(
                'approval',
                principalType,
                parsedToken,
                request.approvalValidatorDigest,
                tokenHmacKey,
            )
        ) return;

        return {
            expiresAt: request.state === 'approved' ? request.approvalExpiresAt : request.expiresAt,
            state: request.state,
            targetIp: request.targetIp,
            targetUserAgent: request.targetUserAgent,
        };
    }

    async function approve(input: Parameters<AuthenticationSessionQrCodeLoginStore['approve']>[0]) {
        const parsedToken = parseAuthenticationSessionToken(input.approvalToken);
        if (!parsedToken || input.sourceSession.principalType !== principalType) return false;

        const source = input.sourceSession;
        const result = await approveStoredRequest(
            [
                keys.qrCodeLogin(parsedToken.selector),
                keys.session(source.id),
                keys.epoch(source.principalId),
            ],
            [
                getAuthenticationSessionQrCodeLoginTokenDigestBytes(
                    'approval',
                    principalType,
                    parsedToken.bytes,
                    tokenHmacKey,
                ).toString('base64url'),
                source.id,
                source.epoch,
                source.principalAuthenticationRevision,
                source.principalId,
                source.principalType,
                idleTtlSeconds * 1000,
                approvalTtlSeconds * 1000,
            ],
        );

        return result === 1;
    }

    async function complete(input: Parameters<AuthenticationSessionQrCodeLoginStore['complete']>[0]) {
        const parsedToken = parseAuthenticationSessionToken(input.completionToken);
        if (!parsedToken) return;

        const request = parseStoredAuthenticationSessionQrCodeLogin(
            await client.hmget(keys.qrCodeLogin(parsedToken.selector), ...storedAuthenticationSessionQrCodeLoginFields),
            principalType,
        );

        if (
            !request
            || !verifyAuthenticationSessionQrCodeLoginToken(
                'completion',
                principalType,
                parsedToken,
                request.completionValidatorDigest,
                tokenHmacKey,
            )
        ) return;

        if (request.state === 'pending') return { state: 'pending' as const };

        if (
            !await input.validatePrincipal({
                principalAuthenticationRevision: request.principalAuthenticationRevision,
                principalId: request.principalId,
                principalType: request.principalType,
            })
        ) return;

        const [redisSeconds, redisMicroseconds] = await client.send('TIME', []) as [string, string];
        const redisNow = Number(redisSeconds) * 1000 + Math.floor(Number(redisMicroseconds) / 1000);
        const binding = {
            absoluteExpiresAt: redisNow + absoluteTtlSeconds * 1000,
            epoch: request.sourceEpoch,
            principalAuthenticationRevision: request.principalAuthenticationRevision,
            principalId: request.principalId,
            principalType: request.principalType,
        };

        const generated = generateAuthenticationSessionToken(
            binding,
            tokenHmacKey,
        );

        const completed = await completeStoredRequest(
            [
                keys.qrCodeLogin(parsedToken.selector),
                keys.session(request.sourceSessionId),
                keys.epoch(request.principalId),
                keys.session(generated.selector),
                keys.index(request.principalId, request.sourceEpoch),
            ],
            [
                getAuthenticationSessionQrCodeLoginTokenDigestBytes(
                    'completion',
                    principalType,
                    parsedToken.bytes,
                    tokenHmacKey,
                ).toString('base64url'),
                request.sourceSessionId,
                request.sourceEpoch,
                request.principalAuthenticationRevision,
                request.principalId,
                request.principalType,
                binding.absoluteExpiresAt,
                idleTtlSeconds,
                generated.selector,
                input.ip,
                input.userAgent ?? '',
                generated.validatorDigest,
            ],
        );

        if (!Array.isArray(completed)) return;

        const [cookieMaxAgeSeconds, now] = completed;

        return {
            cookieMaxAgeSeconds,
            session: {
                ...binding,
                id: generated.selector,
                lastActiveAt: now,
                lastActiveIp: input.ip,
                loggedAt: now,
                loginIp: input.ip,
                userAgent: input.userAgent,
            },
            state: 'completed' as const,
            token: generated.token,
        };
    }

    async function cancel(completionToken: string) {
        const parsedToken = parseAuthenticationSessionToken(completionToken);
        if (!parsedToken) return false;

        return await cancelStoredRequest(
            [keys.qrCodeLogin(parsedToken.selector)],
            [
                getAuthenticationSessionQrCodeLoginTokenDigestBytes(
                    'completion',
                    principalType,
                    parsedToken.bytes,
                    tokenHmacKey,
                ).toString('base64url'),
            ],
        ) === 1;
    }

    return {
        approve,
        cancel,
        complete,
        create,
        getApprovalRequest,
    };
}

function generateAuthenticationSessionQrCodeLoginTokenPair(
    principalType: AuthenticationSessionPrincipalType,
    tokenHmacKey: string | Uint8Array,
): AuthenticationSessionQrCodeLoginTokenPair {
    const selector = randomBytes(tokenSelectorByteLength);
    const approvalBytes = Buffer.concat([
        selector,
        randomBytes(tokenValidatorByteLength),
    ]);

    const completionBytes = Buffer.concat([
        selector,
        randomBytes(tokenValidatorByteLength),
    ]);

    return {
        approvalToken: approvalBytes.toString('base64url'),
        approvalValidatorDigest: getAuthenticationSessionQrCodeLoginTokenDigestBytes(
            'approval',
            principalType,
            approvalBytes,
            tokenHmacKey,
        ).toString('base64url'),
        completionToken: completionBytes.toString('base64url'),
        completionValidatorDigest: getAuthenticationSessionQrCodeLoginTokenDigestBytes(
            'completion',
            principalType,
            completionBytes,
            tokenHmacKey,
        ).toString('base64url'),
        selector: selector.toString('base64url'),
    };
}

function getAuthenticationSessionQrCodeLoginTokenDigestBytes(
    use: 'approval' | 'completion',
    principalType: AuthenticationSessionPrincipalType,
    tokenBytes: Uint8Array,
    tokenHmacKey: string | Uint8Array,
) {
    const hasher = typeof Bun !== 'undefined'
        ? new Bun.CryptoHasher('sha256', tokenHmacKey)
        : createHmac('sha256', tokenHmacKey);

    hasher.update(JSON.stringify([
        'authentication-session-qr-code-login',
        principalType,
        use,
    ]));

    hasher.update(tokenBytes);

    return hasher.digest();
}

function parseStoredAuthenticationSessionQrCodeLogin(
    row: (null | string)[],
    principalType: AuthenticationSessionPrincipalType,
): StoredAuthenticationSessionQrCodeLogin | undefined {
    const [
        approvalValidatorDigest,
        expiresAtValue,
        state,
        targetIp,
        targetUserAgent,
        completionValidatorDigest,
        approvalExpiresAtValue,
        principalAuthenticationRevisionValue,
        principalId,
        storedPrincipalType,
        sourceEpoch,
        sourceSessionId,
    ] = row;

    if (
        !approvalValidatorDigest
        || expiresAtValue == null
        || (state !== 'approved' && state !== 'pending')
        || !targetIp
        || !completionValidatorDigest
    ) return;

    const expiresAt = Number(expiresAtValue);
    if (!Number.isSafeInteger(expiresAt)) return;

    const common: StoredAuthenticationSessionQrCodeLoginCommonData = {
        approvalValidatorDigest,
        completionValidatorDigest,
        expiresAt,
        targetIp,
        targetUserAgent: targetUserAgent || undefined,
    };

    if (state === 'pending') {
        return {
            ...common,
            state,
        };
    }

    if (
        approvalExpiresAtValue == null
        || principalAuthenticationRevisionValue == null
        || !principalId
        || storedPrincipalType !== principalType
        || !sourceEpoch
        || !sourceSessionId
    ) return;

    const approvalExpiresAt = Number(approvalExpiresAtValue);
    const principalAuthenticationRevision = Number(principalAuthenticationRevisionValue);
    if (
        !Number.isSafeInteger(approvalExpiresAt)
        || !Number.isSafeInteger(principalAuthenticationRevision)
        || principalAuthenticationRevision < 0
    ) return;

    return {
        ...common,
        approvalExpiresAt,
        principalAuthenticationRevision,
        principalId,
        principalType,
        sourceEpoch,
        sourceSessionId,
        state: 'approved',
    };
}

function verifyAuthenticationSessionQrCodeLoginToken(
    use: 'approval' | 'completion',
    principalType: AuthenticationSessionPrincipalType,
    parsedToken: ParsedAuthenticationSessionToken,
    validatorDigest: string,
    tokenHmacKey: string | Uint8Array,
) {
    const actualDigest = getAuthenticationSessionQrCodeLoginTokenDigestBytes(
        use,
        principalType,
        parsedToken.bytes,
        tokenHmacKey,
    );

    return verifyAuthenticationSessionTokenDigest(actualDigest, validatorDigest);
}
