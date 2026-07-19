import { vi } from 'vitest';

import { generateAuthenticationSessionToken } from '../../../src/libs/authentication-session/_token';
import {
    createRedisAuthenticationSessionManager,
    createRedisAuthenticationSessionStore,
} from '../../../src/libs/authentication-session/redis-store';
import type {
    RedisAuthenticationSessionManagerOptions,
    RedisAuthenticationSessionStoreOptions,
} from '../../../src/libs/authentication-session/redis-store';
import type { AuthenticationSessionData } from '../../../src/types/data/authentication-session';

// Types
type RedisAuthenticationSessionClient = RedisAuthenticationSessionManagerOptions['client'];
type StoredAuthenticationSessionData = AuthenticationSessionData & { validatorDigest: string };

// Constants
const environment = process.env.ENVIRONMENT?.trim();
export const expectedRedisAuthenticationSessionKeyPrefix = environment
    ? `kiki-core-stack:${environment}:`
    : 'kiki-core-stack:';

const tokenHmacKey = 'a-secure-test-only-token-hmac-key-with-more-than-32-bytes';

// Functions
export const validatePrincipal = () => Promise.resolve(true);

export function createAuthenticationSessionData(
    overrides: Partial<AuthenticationSessionData> = {},
): AuthenticationSessionData {
    return {
        absoluteExpiresAt: 20_000,
        epoch: 'epoch',
        id: 'selector',
        lastActiveAt: 10_000,
        lastActiveIp: '127.0.0.1',
        loggedAt: 9_000,
        loginIp: '127.0.0.1',
        principalAuthenticationRevision: 3,
        principalId: 'admin-id',
        principalType: 'admin',
        ...overrides,
    };
}

export function createClient(
    overrides: Partial<RedisAuthenticationSessionClient> = {},
): RedisAuthenticationSessionClient {
    return {
        get: vi.fn().mockResolvedValue(null),
        hmget: vi.fn().mockResolvedValue([]),
        send: vi.fn().mockResolvedValue(undefined),
        zrange: vi.fn().mockResolvedValue([]),
        zrem: vi.fn().mockResolvedValue(0),
        ...overrides,
    };
}

export function createManager(
    client = createClient(),
    options: Omit<RedisAuthenticationSessionManagerOptions, 'client' | 'principalType'> = {},
) {
    return createRedisAuthenticationSessionManager({
        ...options,
        client,
        principalType: 'admin',
    });
}

export function createStore(
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

function createStoredSessionData(
    overrides: Partial<StoredAuthenticationSessionData> = {},
): StoredAuthenticationSessionData {
    const { validatorDigest = 'digest', ...sessionOverrides } = overrides;

    return {
        ...createAuthenticationSessionData(sessionOverrides),
        validatorDigest,
    };
}

export function createStoredSessionRow(
    overrides: Partial<StoredAuthenticationSessionData> = {},
): (null | string)[] {
    const session = createStoredSessionData(overrides);

    return [
        String(session.absoluteExpiresAt),
        session.epoch,
        session.id,
        String(session.lastActiveAt),
        session.lastActiveIp,
        String(session.loggedAt),
        session.loginIp,
        String(session.principalAuthenticationRevision),
        session.principalId,
        session.principalType,
        session.userAgent ?? null,
        session.validatorDigest,
    ];
}

export function generateStoredSessionToken(overrides: Partial<StoredAuthenticationSessionData> = {}) {
    return generateAuthenticationSessionToken(createStoredSessionData(overrides), tokenHmacKey);
}
