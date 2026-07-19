import { Buffer } from 'node:buffer';

import { nanoid } from 'nanoid';

import type {
    AuthenticateAuthenticationSessionInput,
    AuthenticationSessionManager,
    AuthenticationSessionPrincipalType,
    AuthenticationSessionStore,
    CreateAuthenticationSessionInput,
    ListAuthenticationSessionsInput,
    RotateAuthenticationSessionInput,
} from '../../../types/authentication-session';
import type {
    AuthenticationSessionData,
    AuthenticationSessionListItemData,
} from '../../../types/data/authentication-session';
import {
    generateAuthenticationSessionToken,
    parseAuthenticationSessionToken,
    verifyAuthenticationSessionToken,
} from '../_token';
import type { ParsedAuthenticationSessionToken } from '../_token';

import { createRedisAuthenticationSessionKeys } from './_internals/keys';
import { createRedisAuthenticationSessionQrCodeLoginStore } from './_internals/qr-code-login';
import { createRedisScriptRunner } from './_internals/script-runner';
import {
    createAuthenticationSessionScript,
    finalizeAuthenticationSessionScript,
    initializeAuthenticationSessionEpochScript,
    revokeAllAuthenticationSessionsScript,
    revokeAuthenticationSessionScript,
    rotateAuthenticationSessionScript,
} from './_internals/scripts';
import {
    parseStoredAuthenticationSession,
    parseStoredAuthenticationSessionData,
    storedAuthenticationSessionDataFields,
    storedAuthenticationSessionFields,
} from './_internals/stored-session';

// Types
export interface RedisAuthenticationSessionManagerOptions {
    client: Pick<Bun.RedisClient, 'get' | 'hmget' | 'send' | 'zrange' | 'zrem'>;
    principalType: AuthenticationSessionPrincipalType;
}

export interface RedisAuthenticationSessionStoreOptions extends RedisAuthenticationSessionManagerOptions {
    absoluteTtlSeconds?: number;
    idleTtlSeconds?: number;
    qrCodeLoginApprovalTtlSeconds?: number;
    qrCodeLoginRequestTtlSeconds?: number;
    tokenHmacKey: string | Uint8Array;
    touchIntervalSeconds?: number;
}

interface ValidatedAuthenticationSession {
    session: AuthenticationSessionData;
    validatorDigest: string;
}

// Constants
const authenticationSessionListReadBatchSize = 100;
const defaultAbsoluteTtlSeconds = 60 * 60 * 24 * 30;
const defaultIdleTtlSeconds = 60 * 60 * 24 * 7;
const defaultTouchIntervalSeconds = 60 * 10;
const defaultQrCodeLoginApprovalTtlSeconds = 5;
const defaultQrCodeLoginRequestTtlSeconds = 60;

// Functions
function assertValidAuthenticationSessionDuration(name: string, value: number, minimum: number) {
    if (
        !Number.isSafeInteger(value)
        || value < minimum
        || !Number.isSafeInteger(Date.now() + value * 1000)
    ) throw new TypeError(`${name} must be a safe integer greater than or equal to ${minimum}`);
}

export function createRedisAuthenticationSessionManager(
    options: RedisAuthenticationSessionManagerOptions,
): AuthenticationSessionManager {
    const { client, principalType } = options;
    const keys = createRedisAuthenticationSessionKeys(principalType);

    const revokeStoredSession = createRedisScriptRunner<number>(client, revokeAuthenticationSessionScript);
    const revokeAllStoredSessions = createRedisScriptRunner<string>(client, revokeAllAuthenticationSessionsScript);

    async function list(input: ListAuthenticationSessionsInput) {
        const epochKey = keys.epoch(input.principalId);
        const epoch = await client.get(epochKey);

        if (!epoch) return [];

        const indexKey = keys.index(input.principalId, epoch);
        const now = input.now ?? Date.now();
        const activeScoreMinimum = `(${now}`;
        const selectors = await client.zrange(indexKey, '+inf', activeScoreMinimum, 'BYSCORE', 'REV');

        const list: AuthenticationSessionListItemData[] = [];
        for (let index = 0; index < selectors.length; index += authenticationSessionListReadBatchSize) {
            const batch = selectors.slice(index, index + authenticationSessionListReadBatchSize);
            const rows = await Promise.all(
                batch.map(
                    async (selector) => [
                        selector,
                        await client.hmget(
                            keys.session(selector),
                            ...storedAuthenticationSessionDataFields,
                        ),
                    ] as const,
                ),
            );

            const staleSelectors: string[] = [];

            rows.forEach(([selector, row]) => {
                const session = parseStoredAuthenticationSessionData(row, principalType);
                if (
                    !session
                    || session.absoluteExpiresAt <= now
                    || session.epoch !== epoch
                ) {
                    staleSelectors.push(selector);
                    return;
                }

                list.push({
                    ...session,
                    isCurrent: session.id === input.currentSessionId,
                });
            });

            if (staleSelectors.length > 0) {
                await client.zrem(indexKey, staleSelectors[0] as string, ...staleSelectors.slice(1));
            }
        }

        if (await client.get(epochKey) !== epoch) return [];

        list.sort((a, b) =>
            Number(b.isCurrent) - Number(a.isCurrent)
            || b.lastActiveAt - a.lastActiveAt
            || b.loggedAt - a.loggedAt
            || a.id.localeCompare(b.id),
        );

        return list;
    }

    async function revoke(sessionId: string) {
        const sessionKey = keys.session(sessionId);
        const [epoch, principalId] = await client.hmget(sessionKey, 'epoch', 'principalId');

        if (!epoch || !principalId) return false;

        const revokeResult = await revokeStoredSession(
            [
                sessionKey,
                keys.index(principalId, epoch),
            ],
            [
                epoch,
                principalId,
            ],
        );

        return revokeResult === 1;
    }

    async function revokeAll(principalId: string) {
        const epochKey = keys.epoch(principalId);
        const oldEpoch = await revokeAllStoredSessions([epochKey], []);
        if (!oldEpoch) return;

        const indexKey = keys.index(principalId, oldEpoch);
        await client.send('UNLINK', [indexKey]);
    }

    return {
        list,
        revoke,
        revokeAll,
    };
}

export function createRedisAuthenticationSessionStore(
    options: RedisAuthenticationSessionStoreOptions,
): AuthenticationSessionStore {
    // Constants
    const {
        absoluteTtlSeconds = defaultAbsoluteTtlSeconds,
        client,
        idleTtlSeconds = defaultIdleTtlSeconds,
        principalType,
        qrCodeLoginApprovalTtlSeconds = defaultQrCodeLoginApprovalTtlSeconds,
        qrCodeLoginRequestTtlSeconds = defaultQrCodeLoginRequestTtlSeconds,
        tokenHmacKey,
        touchIntervalSeconds = defaultTouchIntervalSeconds,
    } = options;

    assertValidAuthenticationSessionDuration('absoluteTtlSeconds', absoluteTtlSeconds, 1);
    assertValidAuthenticationSessionDuration('idleTtlSeconds', idleTtlSeconds, 1);
    assertValidAuthenticationSessionDuration('touchIntervalSeconds', touchIntervalSeconds, 0);
    assertValidAuthenticationSessionDuration('qrCodeLoginApprovalTtlSeconds', qrCodeLoginApprovalTtlSeconds, 1);
    assertValidAuthenticationSessionDuration('qrCodeLoginRequestTtlSeconds', qrCodeLoginRequestTtlSeconds, 1);

    if (touchIntervalSeconds >= idleTtlSeconds) {
        throw new TypeError('touchIntervalSeconds must be less than idleTtlSeconds');
    }

    if (qrCodeLoginApprovalTtlSeconds > qrCodeLoginRequestTtlSeconds) {
        throw new TypeError('qrCodeLoginApprovalTtlSeconds must be less than or equal to qrCodeLoginRequestTtlSeconds');
    }

    const tokenHmacKeyByteLength = typeof tokenHmacKey === 'string'
        ? Buffer.byteLength(tokenHmacKey)
        : tokenHmacKey.byteLength;

    if (tokenHmacKeyByteLength < 32) {
        throw new TypeError('authentication session token HMAC key must contain at least 32 bytes');
    }

    const manager = createRedisAuthenticationSessionManager(options);
    const keys = createRedisAuthenticationSessionKeys(principalType);
    const qrCodeLogin = createRedisAuthenticationSessionQrCodeLoginStore({
        absoluteTtlSeconds,
        approvalTtlSeconds: qrCodeLoginApprovalTtlSeconds,
        client,
        idleTtlSeconds,
        principalType,
        qrCodeLoginRequestTtlSeconds,
        tokenHmacKey,
    });

    // Functions
    const initializeEpoch = createRedisScriptRunner<string>(client, initializeAuthenticationSessionEpochScript);
    const createStoredSession = createRedisScriptRunner<number>(client, createAuthenticationSessionScript);
    const finalizeAuthentication = createRedisScriptRunner<number>(client, finalizeAuthenticationSessionScript);
    const rotateStoredSession = createRedisScriptRunner<number>(client, rotateAuthenticationSessionScript);

    async function create(input: CreateAuthenticationSessionInput) {
        if (!Number.isSafeInteger(input.principalAuthenticationRevision) || input.principalAuthenticationRevision < 0) {
            throw new TypeError('principalAuthenticationRevision must be a non-negative safe integer');
        }

        const now = input.now ?? Date.now();
        const absoluteExpiresAt = now + absoluteTtlSeconds * 1000;
        const { expiresAt, ttlSeconds } = getAuthenticationSessionExpiration(absoluteExpiresAt, now, idleTtlSeconds);

        const epochKey = keys.epoch(input.principalId);
        const epoch = await initializeEpoch(
            [epochKey],
            [
                nanoid(43),
                absoluteTtlSeconds,
            ],
        );

        const generated = generateAuthenticationSessionToken(
            {
                absoluteExpiresAt,
                epoch,
                principalAuthenticationRevision: input.principalAuthenticationRevision,
                principalId: input.principalId,
                principalType,
            },
            tokenHmacKey,
        );

        const created = await createStoredSession(
            [
                keys.session(generated.selector),
                epochKey,
                keys.index(input.principalId, epoch),
            ],
            [
                epoch,
                absoluteExpiresAt,
                generated.selector,
                now,
                input.ip,
                input.principalAuthenticationRevision,
                input.principalId,
                principalType,
                input.userAgent ?? '',
                generated.validatorDigest,
                ttlSeconds,
                expiresAt,
            ],
        );

        if (created !== 1) throw new Error('authentication session epoch changed during creation');

        return {
            cookieMaxAgeSeconds: absoluteTtlSeconds,
            session: {
                absoluteExpiresAt,
                epoch,
                id: generated.selector,
                lastActiveAt: now,
                lastActiveIp: input.ip,
                loggedAt: now,
                loginIp: input.ip,
                principalAuthenticationRevision: input.principalAuthenticationRevision,
                principalId: input.principalId,
                principalType,
                userAgent: input.userAgent,
            },
            token: generated.token,
        };
    }

    async function authenticateParsedToken(
        input: AuthenticateAuthenticationSessionInput,
        parsedToken: ParsedAuthenticationSessionToken,
    ): Promise<undefined | ValidatedAuthenticationSession> {
        const sessionKey = keys.session(parsedToken.selector);
        const storedSession = parseStoredAuthenticationSession(
            await client.hmget(sessionKey, ...storedAuthenticationSessionFields),
            principalType,
        );

        if (
            !storedSession
            || !verifyAuthenticationSessionToken(
                storedSession,
                parsedToken,
                storedSession.validatorDigest,
                tokenHmacKey,
            )
        ) return;

        const now = input.now ?? Date.now();
        if (
            storedSession.absoluteExpiresAt <= now
            || storedSession.lastActiveAt + idleTtlSeconds * 1000 <= now
        ) return;

        const { validatorDigest, ...session } = storedSession;
        if (
            !await input.validatePrincipal({
                principalAuthenticationRevision: session.principalAuthenticationRevision,
                principalId: session.principalId,
                principalType: session.principalType,
            })
        ) return;

        const { expiresAt, ttlSeconds } = getAuthenticationSessionExpiration(
            storedSession.absoluteExpiresAt,
            now,
            idleTtlSeconds,
        );

        const result = await finalizeAuthentication(
            [
                sessionKey,
                keys.epoch(storedSession.principalId),
                keys.index(storedSession.principalId, storedSession.epoch),
            ],
            [
                storedSession.epoch,
                storedSession.principalId,
                validatorDigest,
                now,
                input.ip,
                ttlSeconds,
                touchIntervalSeconds * 1000,
                expiresAt,
                idleTtlSeconds * 1000,
            ],
        );

        if (result !== 1 && result !== 2) return;

        if (result === 1) {
            return {
                session,
                validatorDigest,
            };
        }

        return {
            session: {
                ...session,
                lastActiveAt: now,
                lastActiveIp: input.ip,
            },
            validatorDigest,
        };
    }

    async function authenticate(input: AuthenticateAuthenticationSessionInput) {
        const parsedToken = parseAuthenticationSessionToken(input.token);
        if (!parsedToken) return;

        return (await authenticateParsedToken(input, parsedToken))?.session;
    }

    async function rotate(input: RotateAuthenticationSessionInput) {
        const parsedToken = parseAuthenticationSessionToken(input.token);
        if (!parsedToken) return;

        const now = input.now ?? Date.now();
        const authenticated = await authenticateParsedToken(
            {
                ...input,
                now,
            },
            parsedToken,
        );

        if (!authenticated || authenticated.session.principalId !== input.principalId) return;

        const oldSession = authenticated.session;
        const { expiresAt, ttlSeconds } = getAuthenticationSessionExpiration(
            oldSession.absoluteExpiresAt,
            now,
            idleTtlSeconds,
        );

        const generated = generateAuthenticationSessionToken(oldSession, tokenHmacKey);
        const rotated = await rotateStoredSession(
            [
                keys.session(parsedToken.selector),
                keys.session(generated.selector),
                keys.epoch(input.principalId),
                keys.index(input.principalId, oldSession.epoch),
            ],
            [
                input.principalId,
                authenticated.validatorDigest,
                now,
                generated.selector,
                input.ip,
                input.userAgent ?? oldSession.userAgent ?? '',
                generated.validatorDigest,
                ttlSeconds,
                expiresAt,
                idleTtlSeconds * 1000,
            ],
        );

        if (rotated !== 1) return;

        return {
            cookieMaxAgeSeconds: Math.max(1, Math.ceil((oldSession.absoluteExpiresAt - now) / 1000)),
            session: {
                absoluteExpiresAt: oldSession.absoluteExpiresAt,
                epoch: oldSession.epoch,
                id: generated.selector,
                lastActiveAt: now,
                lastActiveIp: input.ip,
                loggedAt: oldSession.loggedAt,
                loginIp: oldSession.loginIp,
                principalAuthenticationRevision: oldSession.principalAuthenticationRevision,
                principalId: input.principalId,
                principalType,
                userAgent: input.userAgent ?? oldSession.userAgent,
            },
            token: generated.token,
        };
    }

    return {
        ...manager,
        authenticate,
        create,
        qrCodeLogin,
        rotate,
    };
}

function getAuthenticationSessionExpiration(absoluteExpiresAt: number, now: number, idleTtlSeconds: number) {
    const expiresAt = Math.min(absoluteExpiresAt, now + idleTtlSeconds * 1000);

    return {
        expiresAt,
        ttlSeconds: Math.max(1, Math.ceil((expiresAt - now) / 1000)),
    };
}
