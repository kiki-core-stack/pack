import { Buffer } from 'node:buffer';

import {
    generateAuthenticationSessionEpoch,
    generateAuthenticationSessionToken,
    getAuthenticationSessionTokenDigestBytes,
    parseAuthenticationSessionToken,
    verifyAuthenticationSessionToken,
} from '..';
import {
    authenticationSessionAbsoluteTtlSeconds,
    authenticationSessionIdleTtlSeconds,
    authenticationSessionTouchIntervalSeconds,
} from '../../../constants/authentication-session';
import type {
    AuthenticateAuthenticationSessionInput,
    AuthenticationSessionManager,
    AuthenticationSessionStore,
    CreateAuthenticationSessionInput,
    ListAuthenticationSessionsInput,
    RotateAuthenticationSessionInput,
} from '../../../types/authentication-session';
import type {
    AuthenticationSessionData,
    AuthenticationSessionListItemData,
    AuthenticationSessionPrincipalType,
} from '../../../types/data/authentication-session';

import {
    createAuthenticationSessionScript,
    createRedisScript,
    finalizeAuthenticationSessionScript,
    initializeAuthenticationSessionEpochScript,
    revokeAllAuthenticationSessionsScript,
    revokeAuthenticationSessionScript,
    rotateAuthenticationSessionScript,
} from './_internals';

// Types
export interface RedisAuthenticationSessionManagerOptions {
    client: Pick<Bun.RedisClient, 'get' | 'hmget' | 'send' | 'zrange' | 'zrem'>;
    keyPrefix?: string;
    principalType: AuthenticationSessionPrincipalType;
}

export interface RedisAuthenticationSessionStoreOptions extends RedisAuthenticationSessionManagerOptions {
    absoluteTtlSeconds?: number;
    idleTtlSeconds?: number;
    tokenHmacKey: string | Uint8Array;
    touchIntervalSeconds?: number;
}

interface StoredAuthenticationSessionData extends AuthenticationSessionData {
    validatorDigest: string;
}

// Constants
const authenticationSessionListReadBatchSize = 100;
const storedAuthenticationSessionFields = [
    'absoluteExpiresAt',
    'epoch',
    'id',
    'lastActiveAt',
    'lastActiveIp',
    'loggedAt',
    'loginIp',
    'principalId',
    'principalType',
    'userAgent',
    'validatorDigest',
] as const;

// Functions
export function createRedisAuthenticationSessionManager(
    options: RedisAuthenticationSessionManagerOptions,
): AuthenticationSessionManager {
    const {
        client,
        keyPrefix = '',
        principalType,
    } = options;

    const revokeStoredSession = createRedisScript(client, revokeAuthenticationSessionScript);
    const revokeAllStoredSessions = createRedisScript(client, revokeAllAuthenticationSessionsScript);

    async function list(input: ListAuthenticationSessionsInput) {
        const epoch = await client.get(
            getRedisAuthenticationSessionEpochKey(principalType, input.principalId, keyPrefix),
        );

        if (!epoch) return [];

        const indexKey = getRedisAuthenticationSessionIndexKey(principalType, input.principalId, epoch, keyPrefix);
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
                            getRedisAuthenticationSessionKey(principalType, selector, keyPrefix),
                            ...storedAuthenticationSessionFields,
                        ),
                    ] as const,
                ),
            );

            const staleSelectors: string[] = [];

            rows.forEach(([selector, row]) => {
                const storedSession = parseStoredAuthenticationSession(row);
                if (
                    !storedSession
                    || storedSession.absoluteExpiresAt <= now
                    || storedSession.epoch !== epoch
                ) {
                    staleSelectors.push(selector);
                    return;
                }

                list.push({
                    ...toAuthenticationSessionData(storedSession),
                    isCurrent: storedSession.id === input.currentSessionId,
                });
            });

            if (staleSelectors.length > 0) {
                await client.zrem(indexKey, staleSelectors[0] as string, ...staleSelectors.slice(1));
            }
        }

        list.sort((a, b) =>
            Number(b.isCurrent) - Number(a.isCurrent)
            || b.lastActiveAt - a.lastActiveAt
            || b.loggedAt - a.loggedAt
            || a.id.localeCompare(b.id),
        );

        return list;
    }

    async function revoke(sessionId: string) {
        const sessionKey = getRedisAuthenticationSessionKey(principalType, sessionId, keyPrefix);
        const [epoch, principalId] = await client.hmget(sessionKey, 'epoch', 'principalId');

        if (!epoch || !principalId) return false;

        const revokeResult = await revokeStoredSession(
            [
                sessionKey,
                getRedisAuthenticationSessionIndexKey(principalType, principalId, epoch, keyPrefix),
            ],
            [
                epoch,
                principalId,
            ],
        );

        return revokeResult === 1;
    }

    async function revokeAll(principalId: string) {
        const epochKey = getRedisAuthenticationSessionEpochKey(principalType, principalId, keyPrefix);
        const oldEpoch = await revokeAllStoredSessions([epochKey], [generateAuthenticationSessionEpoch()]) as string;
        if (!oldEpoch) return;

        const indexKey = getRedisAuthenticationSessionIndexKey(principalType, principalId, oldEpoch, keyPrefix);
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
        absoluteTtlSeconds = authenticationSessionAbsoluteTtlSeconds,
        client,
        idleTtlSeconds = authenticationSessionIdleTtlSeconds,
        keyPrefix = '',
        principalType,
        tokenHmacKey,
        touchIntervalSeconds = authenticationSessionTouchIntervalSeconds,
    } = options;

    const tokenHmacKeyByteLength = typeof tokenHmacKey === 'string'
        ? Buffer.byteLength(tokenHmacKey)
        : tokenHmacKey.byteLength;

    if (tokenHmacKeyByteLength < 32) {
        throw new TypeError('authentication session token HMAC key must contain at least 32 bytes');
    }

    const manager = createRedisAuthenticationSessionManager(options);

    // Functions
    const initializeEpoch = createRedisScript(client, initializeAuthenticationSessionEpochScript);
    const createStoredSession = createRedisScript(client, createAuthenticationSessionScript);
    const finalizeAuthentication = createRedisScript(client, finalizeAuthenticationSessionScript);
    const rotateStoredSession = createRedisScript(client, rotateAuthenticationSessionScript);

    async function create(input: CreateAuthenticationSessionInput) {
        const now = input.now ?? Date.now();
        const absoluteExpiresAt = now + absoluteTtlSeconds * 1000;
        const ttlSeconds = getAuthenticationSessionTtlSeconds(absoluteExpiresAt, now, idleTtlSeconds);
        const expiresAt = getAuthenticationSessionExpiresAt(absoluteExpiresAt, now, idleTtlSeconds);
        const generated = generateAuthenticationSessionToken(principalType, tokenHmacKey);
        const epochKey = getRedisAuthenticationSessionEpochKey(principalType, input.principalId, keyPrefix);
        const epoch = await initializeEpoch([epochKey], [generateAuthenticationSessionEpoch()]) as string;
        const created = await createStoredSession(
            [
                getRedisAuthenticationSessionKey(principalType, generated.selector, keyPrefix),
                epochKey,
                getRedisAuthenticationSessionIndexKey(principalType, input.principalId, epoch, keyPrefix),
            ],
            [
                epoch,
                absoluteExpiresAt,
                generated.selector,
                now,
                input.ip,
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
            session: {
                absoluteExpiresAt,
                epoch,
                id: generated.selector,
                lastActiveAt: now,
                lastActiveIp: input.ip,
                loggedAt: now,
                loginIp: input.ip,
                principalId: input.principalId,
                principalType,
                userAgent: input.userAgent,
            },
            token: generated.token,
            ttlSeconds,
        };
    }

    async function authenticate(input: AuthenticateAuthenticationSessionInput) {
        const parsedToken = parseAuthenticationSessionToken(input.token);
        if (!parsedToken) return;

        const sessionKey = getRedisAuthenticationSessionKey(principalType, parsedToken.selector, keyPrefix);
        const storedSession = parseStoredAuthenticationSession(
            await client.hmget(sessionKey, ...storedAuthenticationSessionFields),
        );

        if (
            !storedSession
            || !verifyAuthenticationSessionToken(
                principalType,
                parsedToken,
                storedSession.validatorDigest,
                tokenHmacKey,
            )
        ) return;

        const now = input.now ?? Date.now();
        const ttl = getAuthenticationSessionTtlSeconds(storedSession.absoluteExpiresAt, now, idleTtlSeconds);
        const expiresAt = getAuthenticationSessionExpiresAt(storedSession.absoluteExpiresAt, now, idleTtlSeconds);
        const result = await finalizeAuthentication(
            [
                sessionKey,
                getRedisAuthenticationSessionEpochKey(principalType, storedSession.principalId, keyPrefix),
                getRedisAuthenticationSessionIndexKey(
                    principalType,
                    storedSession.principalId,
                    storedSession.epoch,
                    keyPrefix,
                ),
            ],
            [
                storedSession.epoch,
                storedSession.principalId,
                storedSession.validatorDigest,
                now,
                input.ip,
                ttl,
                touchIntervalSeconds * 1000,
                expiresAt,
                idleTtlSeconds * 1000,
            ],
        );

        if (result !== 1 && result !== 2) return;

        const session = toAuthenticationSessionData(storedSession);
        if (result === 1) return { session };

        return {
            refreshedTtlSeconds: ttl,
            session: {
                ...session,
                lastActiveAt: now,
                lastActiveIp: input.ip,
            },
        };
    }

    async function rotate(input: RotateAuthenticationSessionInput) {
        const now = input.now ?? Date.now();
        const authenticated = await authenticate({
            ...input,
            now,
        });

        if (!authenticated || authenticated.session.principalId !== input.principalId) return;

        const parsedToken = parseAuthenticationSessionToken(input.token)!;
        const oldSession = authenticated.session;
        const ttlSeconds = getAuthenticationSessionTtlSeconds(oldSession.absoluteExpiresAt, now, idleTtlSeconds);
        const expiresAt = getAuthenticationSessionExpiresAt(oldSession.absoluteExpiresAt, now, idleTtlSeconds);
        const generated = generateAuthenticationSessionToken(principalType, tokenHmacKey);
        const rotated = await rotateStoredSession(
            [
                getRedisAuthenticationSessionKey(principalType, parsedToken.selector, keyPrefix),
                getRedisAuthenticationSessionKey(principalType, generated.selector, keyPrefix),
                getRedisAuthenticationSessionEpochKey(principalType, input.principalId, keyPrefix),
                getRedisAuthenticationSessionIndexKey(
                    principalType,
                    input.principalId,
                    oldSession.epoch,
                    keyPrefix,
                ),
            ],
            [
                input.principalId,
                getAuthenticationSessionTokenDigestBytes(principalType, parsedToken.bytes, tokenHmacKey)
                    .toString('base64url'),
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
            session: {
                absoluteExpiresAt: oldSession.absoluteExpiresAt,
                epoch: oldSession.epoch,
                id: generated.selector,
                lastActiveAt: now,
                lastActiveIp: input.ip,
                loggedAt: oldSession.loggedAt,
                loginIp: oldSession.loginIp,
                principalId: input.principalId,
                principalType,
                userAgent: input.userAgent ?? oldSession.userAgent,
            },
            token: generated.token,
            ttlSeconds,
        };
    }

    return {
        ...manager,
        authenticate,
        create,
        rotate,
    };
}

function getAuthenticationSessionExpiresAt(absoluteExpiresAt: number, now: number, idleTtlSeconds: number) {
    return Math.min(absoluteExpiresAt, now + idleTtlSeconds * 1000);
}

function getAuthenticationSessionTtlSeconds(absoluteExpiresAt: number, now: number, idleTtlSeconds: number) {
    return Math.max(1, Math.min(idleTtlSeconds, Math.ceil((absoluteExpiresAt - now) / 1000)));
}

export function getRedisAuthenticationSessionEpochKey(
    principalType: AuthenticationSessionPrincipalType,
    principalId: string,
    keyPrefix = '',
) {
    return `${keyPrefix}authenticationSessionEpoch:${principalType}:${principalId}`;
}

export function getRedisAuthenticationSessionIndexKey(
    principalType: AuthenticationSessionPrincipalType,
    principalId: string,
    epoch: string,
    keyPrefix = '',
): string {
    return `${keyPrefix}authenticationSessions:${principalType}:${principalId}:${epoch}`;
}

export function getRedisAuthenticationSessionKey(
    principalType: AuthenticationSessionPrincipalType,
    selector: string,
    keyPrefix = '',
) {
    return `${keyPrefix}authenticationSession:${principalType}:${selector}`;
}

function parseStoredAuthenticationSession(values: (null | string)[]): StoredAuthenticationSessionData | undefined {
    const [
        absoluteExpiresAt,
        epoch,
        id,
        lastActiveAt,
        lastActiveIp,
        loggedAt,
        loginIp,
        principalId,
        principalType,
        userAgent,
        validatorDigest,
    ] = values;

    if (!absoluteExpiresAt) return;

    return {
        absoluteExpiresAt: Number(absoluteExpiresAt),
        epoch: epoch as string,
        id: id as string,
        lastActiveAt: Number(lastActiveAt),
        lastActiveIp: lastActiveIp as string,
        loggedAt: Number(loggedAt),
        loginIp: loginIp as string,
        principalId: principalId as string,
        principalType: principalType as AuthenticationSessionPrincipalType,
        userAgent: userAgent || undefined,
        validatorDigest: validatorDigest as string,
    };
}

function toAuthenticationSessionData(storedSession: StoredAuthenticationSessionData): AuthenticationSessionData {
    const { validatorDigest, ...session } = storedSession;

    return session;
}
