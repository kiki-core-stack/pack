import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';

import { redisClient } from '../../connections/redis';
import { AuthEventType } from '../../constants/auth';
import type {
    AuthFactor,
    AuthPrincipal,
    AuthRequestInfo,
    AuthSession,
    StoredAuthSession,
} from '../../types/auth';
import type { PlatformAuthConfig } from '../../types/platform';
import { logger } from '../_internals/logger';

import {
    generateRandomToken,
    sha256Hex,
    timingSafeEqualStrings,
} from './_internals/crypto';
import { authRedisKey } from './_internals/redis';
import { AuthError } from './error';
import {
    recordAuthEvent,
    truncateAuthUserAgent,
} from './event';
import {
    findAuthPrincipalSetting,
    hasAuthSecondFactor,
} from './principal-setting';
import type { AuthRealm } from './realm';

export interface CreateAuthSessionInput {
    approvedBySessionId?: string;
    factors: AuthFactor[];

    /**
     * 必須是在驗證任何因子「之前」以 `readAuthSessionGeneration` 讀到的世代。
     */
    generation: number;
    principalId: string;
    request: AuthRequestInfo;
    restricted?: boolean;
}

export interface CreatedAuthSession {
    /**
     * cookie 的有效秒數：絕對上限的剩餘時間。
     */
    maxAgeSeconds: number;
    session: AuthSession;
    token: string;
}

// Constants
const principalActiveMarkTtlSeconds = 60;
const principalIdPattern = /^[\da-f]{24}$/;
const restrictedSessionTtlSeconds = 900;
const tokenPartPattern = /^[\w-]{16,64}$/;

// Functions

/**
 * 以 token 驗證工作階段，HTTP 請求與長連線（例如 ws.io）共用。依序確認：
 * - secret、世代與期限。
 * - 帳號仍存在且啟用（約每 60 秒重新查詢一次；不通過時踢除該帳號的全部工作階段）。
 * - 受限工作階段仍有存在的必要：帳號已有第二因子（由另一個工作階段完成設定）時踢除，持有者必須重新登入並通過第二步。
 *
 * 不檢查 IP 存取政策、不順延工作階段，也不區分受限與否，由呼叫端依用途處理。
 */
export async function authenticateAuthSession(realm: AuthRealm<any>, token: string): Promise<AuthSession | undefined> {
    const authenticated = await authenticateAuthToken(realm, token);
    if (!authenticated) return;
    const { session } = authenticated;
    if (!authenticated.principalActiveMarked && !await ensureAuthPrincipalActive(realm, session.principalId)) return;
    if (session.restricted && hasAuthSecondFactor(realm, await findAuthPrincipalSetting(realm, session.principalId))) {
        await revokeAuthSession(realm, session.principalId, session.id);
        return;
    }

    return session;
}

/**
 * 比對 token 的 secret、世代與期限。一次 Redis 往返讀取工作階段、世代計數與帳號啟用標記（是否仍在 60 秒內確認過）。
 */
async function authenticateAuthToken(realm: AuthRealm<any>, token: string) {
    const [
        principalId,
        sessionId,
        secret,
        ...rest
    ] = token.split('.');

    if (
        rest.length
        || !principalId
        || !sessionId
        || !secret
        // token 來自用戶端，組成 Redis key 前必須驗證格式。
        || !principalIdPattern.test(principalId)
        || !tokenPartPattern.test(sessionId)
        || !tokenPartPattern.test(secret)
    ) return;

    const [
        rawSession,
        generation,
        principalActiveMarked,
    ] = await Promise.all([
        redisClient.get(toSessionKey(realm, principalId, sessionId)),
        readAuthSessionGeneration(realm, principalId),
        redisClient.exists(toPrincipalActiveKey(realm, principalId)),
    ]);

    if (rawSession === null) return;
    const storedSession = JSON.parse(rawSession) as StoredAuthSession;
    if (!timingSafeEqualStrings(storedSession.secretHash, sha256Hex(secret))) return;
    if (storedSession.generation !== generation) return;
    if (getSessionRemainingSeconds(storedSession, await realm.getConfig()) <= 0) return;
    return {
        principalActiveMarked,
        session: {
            ...storedSession,
            id: sessionId,
            principalId,
        },
    };
}

/**
 * 建立工作階段，並處理同時登入上限。
 */
export async function createAuthSession(
    realm: AuthRealm<any>,
    input: CreateAuthSessionInput,
): Promise<CreatedAuthSession> {
    const config = await realm.getConfig();
    const now = EnhancedDate.now();
    const secret = generateRandomToken();
    const sessionId = generateRandomToken(16);
    const storedSession: StoredAuthSession = {
        approvedBySessionId: input.approvedBySessionId,
        createdAt: now,
        factors: input.factors,
        generation: input.generation,
        idleTimeoutSeconds: config.session.idleTimeoutSeconds,
        ip: input.request.ip,
        lastActiveAt: now,
        restricted: input.restricted ?? false,
        secretHash: sha256Hex(secret),
        userAgent: truncateAuthUserAgent(input.request.userAgent),
    };

    const principalSessionsKey = toPrincipalSessionsKey(realm, input.principalId, input.generation);
    await Promise.all([
        redisClient.set(
            toSessionKey(realm, input.principalId, sessionId),
            JSON.stringify(storedSession),
            'EX',
            getSessionRemainingSeconds(storedSession, config, now).toString(),
        ),
        redisClient.sadd(principalSessionsKey, sessionId),
        redisClient.expire(principalSessionsKey, config.session.absoluteTimeoutSeconds),
    ]);

    // 登入時順便清理索引；超過上限時踢除排在上限之後的工作階段（最久未活動者）。
    // 每個並行的登入都依同一個排序決定踢除對象，不排除自己：並行登入時只會留下排序在前的，不會互相踢除而全部失效。
    const sessions = await listAuthSessions(realm, input.principalId);
    if (config.maxSessions !== null) {
        const excessSessions = sessions.slice(config.maxSessions);
        for (const session of excessSessions) await revokeAuthSession(realm, input.principalId, session.id);
        if (excessSessions.some((session) => session.id === sessionId)) throw new AuthError('sessionInvalid');
    }

    return {
        maxAgeSeconds: storedSession.restricted ? restrictedSessionTtlSeconds : config.session.absoluteTimeoutSeconds,
        session: {
            ...storedSession,
            id: sessionId,
            principalId: input.principalId,
        },
        token: `${input.principalId}.${sessionId}.${secret}`,
    };
}

/**
 * 查詢資料庫確認帳號存在且啟用：通過則寫入 60 秒的標記（所有 worker 與機器共用），不通過則全部踢除並回傳 false。
 */
async function ensureAuthPrincipalActive<P extends AuthPrincipal>(realm: AuthRealm<P>, principalId: string) {
    const principal = await realm.findPrincipalById(principalId);
    if (!principal || !realm.isPrincipalActive(principal)) {
        await revokeAllAuthSessions(realm, principalId);
        return false;
    }

    await redisClient.set(toPrincipalActiveKey(realm, principalId), '1', 'EX', principalActiveMarkTtlSeconds.toString());
    return true;
}

/**
 * 工作階段依目前設定還能存活的秒數；小於等於 0 表示已過期。
 * 受限工作階段固定 15 分鐘到期，不套用平台設定的期限。
 */
function getSessionRemainingSeconds(session: StoredAuthSession, config: PlatformAuthConfig, now = EnhancedDate.now()) {
    const createdAt = new EnhancedDate(session.createdAt);
    const expiresAt = session.restricted
        ? createdAt.addSeconds(restrictedSessionTtlSeconds)
        : EnhancedDate.min([
            createdAt.addSeconds(config.session.absoluteTimeoutSeconds),
            new EnhancedDate(session.lastActiveAt).addSeconds(config.session.idleTimeoutSeconds),
        ]);

    return Math.ceil((expiresAt.getTime() - now) / 1000);
}

/**
 * 列出帳號目前世代的有效工作階段（最近活動者在前，時間相同時依 ID，順序固定），並移除索引中已失效的成員。
 */
export async function listAuthSessions(realm: AuthRealm<any>, principalId: string): Promise<AuthSession[]> {
    const [config, generation] = await Promise.all([
        realm.getConfig(),
        readAuthSessionGeneration(realm, principalId),
    ]);

    const principalSessionsKey = toPrincipalSessionsKey(realm, principalId, generation);
    const sessionIds = await redisClient.smembers(principalSessionsKey);
    if (!sessionIds.length) return [];
    const rawSessions = await redisClient.mget(
        ...sessionIds.map((sessionId) => toSessionKey(realm, principalId, sessionId)),
    );

    const sessions: AuthSession[] = [];
    const staleSessionIds: string[] = [];
    sessionIds.forEach((sessionId, index) => {
        const rawSession = rawSessions[index];
        const storedSession = rawSession ? JSON.parse(rawSession) as StoredAuthSession : undefined;
        if (!storedSession || getSessionRemainingSeconds(storedSession, config) <= 0) staleSessionIds.push(sessionId);
        else {
            sessions.push({
                ...storedSession,
                id: sessionId,
                principalId,
            });
        }
    });

    if (staleSessionIds.length) {
        await Promise.all([
            redisClient.srem(principalSessionsKey, ...staleSessionIds),
            redisClient.del(...staleSessionIds.map((sessionId) => toSessionKey(realm, principalId, sessionId))),
        ]);
    }

    return sessions.sort((a, b) => b.lastActiveAt - a.lastActiveAt || a.id.localeCompare(b.id));
}

async function notifySessionsRevoked(realm: AuthRealm<any>, principalId: string, sessionIds: string[]) {
    if (!sessionIds.length) return;
    try {
        await realm.onSessionsRevoked?.(principalId, sessionIds);
    } catch (error) {
        logger.error(
            'Auth realm onSessionsRevoked failed',
            {
                error,
                realm: realm.name,
            },
        );
    }
}

/**
 * 讀取帳號的世代計數。建立工作階段前必須在驗證任何因子「之前」讀取，
 * 驗證期間若發生全部踢除（例如同時變更密碼），以舊世代建立的工作階段即無效。
 */
export async function readAuthSessionGeneration(realm: AuthRealm<any>, principalId: string) {
    return Number(await redisClient.get(toSessionGenerationKey(realm, principalId))) || 0;
}

/**
 * 踢除帳號的全部工作階段：世代計數加一（單一原子指令）後，世代不符的工作階段一律無效，
 * 不會漏掉同時建立中的工作階段；接著清除上一個世代的工作階段與索引。回傳被踢除的工作階段 ID。
 */
export async function revokeAllAuthSessions(realm: AuthRealm<any>, principalId: string) {
    const generation = await redisClient.incr(toSessionGenerationKey(realm, principalId));
    const previousPrincipalSessionsKey = toPrincipalSessionsKey(realm, principalId, generation - 1);
    const sessionIds = await redisClient.smembers(previousPrincipalSessionsKey);
    await redisClient.del(
        previousPrincipalSessionsKey,
        ...sessionIds.map((sessionId) => toSessionKey(realm, principalId, sessionId)),
    );

    await notifySessionsRevoked(realm, principalId, sessionIds);
    return sessionIds;
}

/**
 * 在會使既有工作階段失效的變更（變更密碼、重設雙重驗證）前後各全部踢除一次，回傳變更的結果。
 *
 * 變更與踢除分屬資料庫與 Redis，無法一起提交：
 * - 先踢除：踢除失敗時變更不會發生，不會出現「已變更但既有工作階段仍有效」。
 * - 變更後再踢除：清掉兩次踢除之間以舊憑證登入的工作階段；變更失敗時也照樣執行。
 */
export async function revokeAllAuthSessionsAround<T>(
    realm: AuthRealm<any>,
    principalId: string,
    change: () => Promise<T>,
) {
    await revokeAllAuthSessions(realm, principalId);
    try {
        return await change();
    } finally {
        await revokeAllAuthSessions(realm, principalId);
    }
}

/**
 * 踢除單一工作階段；回傳是否確實刪除了一筆。
 *
 * 依序刪除、通知、清理索引：索引殘留的 ID 會在列出時清掉，不應擋住通知。
 */
export async function revokeAuthSession(realm: AuthRealm<any>, principalId: string, sessionId: string) {
    if (!principalIdPattern.test(principalId) || !tokenPartPattern.test(sessionId)) return false;
    const generation = await readAuthSessionGeneration(realm, principalId);
    const deletedCount = await redisClient.del(toSessionKey(realm, principalId, sessionId));
    if (deletedCount === 1) await notifySessionsRevoked(realm, principalId, [sessionId]);
    await redisClient.srem(toPrincipalSessionsKey(realm, principalId, generation), sessionId);
    return deletedCount === 1;
}

/**
 * 踢除其他全部工作階段（踢除其他裝置）：目前的工作階段原封不動，不升世代也不換發，
 * 綁在它上面的長連線因此不受影響。
 *
 * 對象取自「目前工作階段所屬世代」的索引，不採用當下最新的世代：該世代已被全部踢除時索引已不存在，
 * 目前的工作階段不在其中，拋出 `sessionInvalid`，也不會動到之後世代的工作階段。
 * 讀取索引之後才建立的工作階段不在對象內。通知的是踢除的對象，其中可能包含已過期或已被別的請求刪除者；
 * 事件的 `count` 則是實際刪除的筆數。
 */
export async function revokeOtherAuthSessions(realm: AuthRealm<any>, session: AuthSession, request: AuthRequestInfo) {
    const principalSessionsKey = toPrincipalSessionsKey(realm, session.principalId, session.generation);
    const sessionIds = await redisClient.smembers(principalSessionsKey);
    if (!sessionIds.includes(session.id)) throw new AuthError('sessionInvalid');
    const otherSessionIds = sessionIds.filter((sessionId) => sessionId !== session.id);
    let count = 0;
    if (otherSessionIds.length) {
        count = await redisClient.del(
            ...otherSessionIds.map((sessionId) => toSessionKey(realm, session.principalId, sessionId)),
        );

        await notifySessionsRevoked(realm, session.principalId, otherSessionIds);
        await redisClient.srem(principalSessionsKey, ...otherSessionIds);
    }

    await recordAuthEvent(
        realm,
        {
            metadata: { count },
            principalId: session.principalId,
            request,
            sessionId: session.id,
            type: AuthEventType.OtherSessionsRevoked,
        },
    );
}

function toPrincipalActiveKey(realm: AuthRealm<any>, principalId: string) {
    return authRedisKey(realm.name, 'principal-active', principalId);
}

function toPrincipalSessionsKey(realm: AuthRealm<any>, principalId: string, generation: number) {
    return authRedisKey(realm.name, 'principal-sessions', principalId, generation);
}

function toSessionGenerationKey(realm: AuthRealm<any>, principalId: string) {
    return authRedisKey(realm.name, 'session-generation', principalId);
}

function toSessionKey(realm: AuthRealm<any>, principalId: string, sessionId: string) {
    return authRedisKey(realm.name, 'session', principalId, sessionId);
}

/**
 * 順延工作階段：距離上次順延超過門檻（5 分鐘與閒置逾時四分之一的較小者）才寫回最後活動時間與 TTL。
 * 閒置逾時取「目前設定」與「上次寫入時採用的值」較小者，設定調高後既有工作階段仍會在原本的存活時間內順延。
 * 以「存在才寫入」更新，已被踢除的工作階段不會被寫回；受限工作階段不順延。
 */
export async function touchAuthSession(realm: AuthRealm<any>, session: AuthSession) {
    if (session.restricted) return;
    const config = await realm.getConfig();
    const now = EnhancedDate.now();
    const thresholdSeconds = Math.min(
        300,
        Math.min(config.session.idleTimeoutSeconds, session.idleTimeoutSeconds) / 4,
    );

    if (new EnhancedDate(session.lastActiveAt).addSeconds(thresholdSeconds).isAfter(now)) return;
    const {
        id,
        principalId,
        ...storedSession
    } = session;

    storedSession.idleTimeoutSeconds = config.session.idleTimeoutSeconds;
    storedSession.lastActiveAt = now;
    const remainingSeconds = getSessionRemainingSeconds(storedSession, config, now);
    if (remainingSeconds <= 0) return;
    await redisClient.set(
        toSessionKey(realm, principalId, id),
        JSON.stringify(storedSession),
        'XX',
        'EX',
        remainingSeconds.toString(),
    );
}

/**
 * 受限工作階段綁定第二因子後，換發正常的工作階段。以「成功刪除受限工作階段」作為放行條件，已被踢除時拋出
 * `sessionInvalid`；新工作階段沿用受限工作階段的世代，期間若發生全部踢除，新工作階段即無效。
 */
export async function upgradeRestrictedAuthSession(
    realm: AuthRealm<any>,
    session: AuthSession,
    factor: AuthFactor,
    request: AuthRequestInfo,
) {
    if (!await revokeAuthSession(realm, session.principalId, session.id)) throw new AuthError('sessionInvalid');
    return await createAuthSession(
        realm,
        {
            factors: [
                ...session.factors,
                factor,
            ],
            generation: session.generation,
            principalId: session.principalId,
            request,
        },
    );
}
