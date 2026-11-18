import { redisClient } from '../../connections/redis';
import { AuthEventType } from '../../constants/auth';
import type {
    AuthFactor,
    AuthRequestInfo,
} from '../../types/auth';

import { sha256Hex } from './_internals/crypto';
import { authRedisKey } from './_internals/redis';
import { AuthError } from './error';
import { recordAuthEvent } from './event';
import type { AuthRealm } from './realm';

type AuthAttemptKind = keyof typeof authRateLimits;

// Constants

/**
 * 預設門檻，說明見 `docs/auth.md` 的「防暴力破解」。
 */
const authRateLimits = {
    codeBySubject: {
        limit: 5,
        windowSeconds: 900,
    },
    codeSendBySubject: {
        limit: 5,
        windowSeconds: 900,
    },
    currentPasswordByPrincipal: {
        limit: 5,
        windowSeconds: 900,
    },
    passwordByIdentifier: {
        limit: 20,
        windowSeconds: 900,
    },
    passwordByIdentifierAndIp: {
        limit: 5,
        windowSeconds: 900,
    },
    passwordResetSendByPrincipal: {
        limit: 5,
        windowSeconds: 900,
    },
    secondFactorByPrincipal: {
        limit: 5,
        windowSeconds: 900,
    },
    totpSetupByPrincipal: {
        limit: 5,
        windowSeconds: 900,
    },
    unauthenticatedChallengeByIp: {
        limit: 30,
        windowSeconds: 60,
    },
} as const satisfies Record<string, { limit: number; windowSeconds: number }>;

// Classes
/**
 * 嘗試次數超過門檻。
 */
export class AuthRateLimitError extends AuthError {
    /**
     * 是否為這段計數期間內第一次超過門檻；事件只在這一次記錄，之後被擋下的請求不再寫入。
     */
    readonly first: boolean;

    constructor(first: boolean) {
        super('tooManyAttempts');
        this.first = first;
        this.name = 'AuthRateLimitError';
    }
}

// Functions
export async function clearAuthAttempts(realmName: string, kind: AuthAttemptKind, key: string) {
    await redisClient.del(toAttemptsKey(realmName, kind, key));
}

/**
 * 先計數再驗證：先把計數加一，超過門檻即拋出 `AuthRateLimitError`，呼叫端不得再進行驗證；驗證成功後才清除計數。
 * 不可改成「先讀計數、失敗才加一」，否則並行送出的大量猜測都會通過次數檢查。
 *
 * 每種驗證用途各有自己的計數：通過其中一種驗證只清除該種的計數，不能藉此重設另一種的猜測次數。
 */
export async function consumeAuthAttempt(realmName: string, kind: AuthAttemptKind, key: string) {
    const { limit, windowSeconds } = authRateLimits[kind];
    const redisKey = toAttemptsKey(realmName, kind, key);
    const [count] = await Promise.all([
        redisClient.incr(redisKey),
        redisClient.send(
            'EXPIRE',
            [
                redisKey,
                windowSeconds.toString(),
                'NX',
            ],
        ),
    ]);

    if (count > limit) throw new AuthRateLimitError(count === limit + 1);
}

/**
 * 以帳號為維度的 `consumeAuthAttempt`；第一次超過門檻時寫入一筆 `RateLimited` 事件。
 */
export async function consumeAuthPrincipalAttempt(
    realm: AuthRealm<any>,
    kind: AuthAttemptKind,
    principalId: string,
    factor: AuthFactor,
    request?: AuthRequestInfo,
) {
    await recordAuthRateLimitAround(
        realm,
        principalId,
        factor,
        request,
        async () => await consumeAuthAttempt(realm.name, kind, principalId),
    );
}

/**
 * 執行會計數的驗證 `verify`；它第一次超過門檻時寫入一筆 `RateLimited` 事件。
 */
export async function recordAuthRateLimitAround<T>(
    realm: AuthRealm<any>,
    principalId: string,
    factor: AuthFactor,
    request: AuthRequestInfo | undefined,
    verify: () => Promise<T>,
) {
    try {
        return await verify();
    } catch (error) {
        if (error instanceof AuthRateLimitError && error.first) {
            await recordAuthEvent(
                realm,
                {
                    factor,
                    principalId,
                    request,
                    type: AuthEventType.RateLimited,
                },
            );
        }

        throw error;
    }
}

// key 可能含有用戶端輸入的字串，雜湊後再作為 Redis key 以固定長度。
function toAttemptsKey(realmName: string, kind: string, key: string) {
    return authRedisKey(realmName, 'attempts', kind, sha256Hex(key));
}
