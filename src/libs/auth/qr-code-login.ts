import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';

import { redisClient } from '../../connections/redis';
import { AuthEventType } from '../../constants/auth';
import type { AuthFactor } from '../../types/auth';

import {
    generateRandomToken,
    sha256Hex,
    timingSafeEqualStrings,
} from './_internals/crypto';
import { authRedisKey } from './_internals/redis';
import { assertAuthIpAccess } from './access';
import { AuthError } from './error';
import {
    recordAuthEvent,
    truncateAuthUserAgent,
} from './event';
import { consumeAuthAttempt } from './rate-limit';
import type { AuthRealm } from './realm';
import {
    createAuthSession,
    listAuthSessions,
    readAuthSessionGeneration,
} from './session';
import type { CreatedAuthSession } from './session';
import type {
    AuthPrincipal,
    AuthRequestInfo,
    AuthSession,
} from './types';

export type AuthQrCodeLoginPollOutcome =
  | {
      created: CreatedAuthSession;
      state: 'completed';
  }
  | { state: 'pending' | 'rejected' };

interface QrCodeLoginDecision {
    approved: boolean;
    factors: AuthFactor[];
    principalId: string;
    sessionId: string;
}

interface QrCodeLoginRequest {
    createdAt: number;
    ip?: string;
    pollSecretHash: string;
    userAgent?: string;
}

// Constants
const qrCodeLoginTtlSeconds = 120;

// Functions
async function assertQrCodeLoginEnabled(realm: AuthRealm<any>) {
    if (!(await realm.getConfig()).qrCodeLoginEnabled) throw new AuthError('qrCodeLoginDisabled');
}

/**
 * 未登入裝置建立 QR Code 登入請求。`qrToken` 放進 QR 的網址；`pollSecret` 只留在該裝置，
 * 只拿到 `qrToken`（例如拍到螢幕）無法取得工作階段。
 */
export async function createAuthQrCodeLogin(realm: AuthRealm<any>, request: AuthRequestInfo) {
    await assertQrCodeLoginEnabled(realm);
    await consumeAuthAttempt(realm.name, 'unauthenticatedChallengeByIp', request.ip ?? '');
    const pollSecret = generateRandomToken();
    const qrToken = generateRandomToken();
    await redisClient.set(
        toRequestKey(realm, qrToken),
        JSON.stringify({
            createdAt: EnhancedDate.now(),
            ip: request.ip,
            pollSecretHash: sha256Hex(pollSecret),
            userAgent: truncateAuthUserAgent(request.userAgent),
        } satisfies QrCodeLoginRequest),
        'EX',
        qrCodeLoginTtlSeconds.toString(),
    );

    return {
        expiresInSeconds: qrCodeLoginTtlSeconds,
        pollSecret,
        qrToken,
    };
}

/**
 * 已登入裝置核准或拒絕 QR Code 登入。以「不存在才寫入」保證只有第一個決定生效；受限工作階段不可核准。
 */
export async function decideAuthQrCodeLogin(
    realm: AuthRealm<any>,
    session: AuthSession,
    qrToken: string,
    approved: boolean,
    request: AuthRequestInfo,
) {
    await assertQrCodeLoginEnabled(realm);
    if (session.restricted) throw new AuthError('secondFactorSetupRequired');
    await getQrCodeLoginRequest(realm, qrToken);
    const written = await redisClient.set(
        toDecisionKey(realm, qrToken),
        JSON.stringify({
            approved,
            factors: session.factors,
            principalId: session.principalId,
            sessionId: session.id,
        } satisfies QrCodeLoginDecision),
        'EX',
        qrCodeLoginTtlSeconds.toString(),
        'NX',
    );

    if (written === null) throw new AuthError('qrCodeLoginExpired');
    await recordAuthEvent(
        realm,
        {
            principalId: session.principalId,
            request,
            sessionId: session.id,
            type: approved ? AuthEventType.QrCodeLoginApproved : AuthEventType.QrCodeLoginRejected,
        },
    );
}

/**
 * 已登入裝置掃描後查詢請求方的資訊，供確認畫面顯示。
 */
export async function getAuthQrCodeLoginInfo(realm: AuthRealm<any>, qrToken: string) {
    await assertQrCodeLoginEnabled(realm);
    const request = await getQrCodeLoginRequest(realm, qrToken);
    return {
        createdAt: new EnhancedDate(request.createdAt).toISOString(),
        ip: request.ip,
        userAgent: request.userAgent,
    };
}

async function getQrCodeLoginRequest(realm: AuthRealm<any>, qrToken: string) {
    const rawRequest = await redisClient.get(toRequestKey(realm, qrToken));
    if (rawRequest === null) throw new AuthError('qrCodeLoginExpired');
    return JSON.parse(rawRequest) as QrCodeLoginRequest;
}

/**
 * 未登入裝置輪詢結果。核准後領取決定並在該裝置發出新工作階段；新工作階段繼承核准者的登入因子並記錄核准來源。
 */
export async function pollAuthQrCodeLogin<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    qrToken: string,
    pollSecret: string,
    request: AuthRequestInfo,
): Promise<AuthQrCodeLoginPollOutcome> {
    await assertQrCodeLoginEnabled(realm);
    // 1. 比對 pollSecret。
    const qrCodeLoginRequest = await getQrCodeLoginRequest(realm, qrToken);
    if (!timingSafeEqualStrings(qrCodeLoginRequest.pollSecretHash, sha256Hex(pollSecret))) {
        throw new AuthError('qrCodeLoginExpired');
    }

    const decisionKey = toDecisionKey(realm, qrToken);
    const rawPendingDecision = await redisClient.get(decisionKey);
    if (rawPendingDecision === null) return { state: 'pending' };
    // 2. 世代必須在取出決定之前讀取。
    const { principalId } = JSON.parse(rawPendingDecision) as QrCodeLoginDecision;
    const generation = await readAuthSessionGeneration(realm, principalId);
    // 3. 取出決定；只有一個輪詢請求能領取。
    const rawDecision = await redisClient.getdel(decisionKey);
    if (rawDecision === null) throw new AuthError('qrCodeLoginExpired');
    await redisClient.del(toRequestKey(realm, qrToken));
    const decision = JSON.parse(rawDecision) as QrCodeLoginDecision;
    if (!decision.approved) return { state: 'rejected' };

    // 4. 核准者的工作階段必須仍然有效、帳號啟用，並以領取裝置的 IP 檢查 IP 存取政策。
    const approverSessions = await listAuthSessions(realm, decision.principalId);
    if (!approverSessions.some((session) => session.id === decision.sessionId && !session.restricted)) {
        throw new AuthError('qrCodeLoginExpired');
    }

    const principal = await realm.findPrincipalById(decision.principalId);
    if (!principal || !realm.isPrincipalActive(principal)) throw new AuthError('qrCodeLoginExpired');
    await assertAuthIpAccess(realm, request, decision.principalId);

    // 5. 以第 2 步讀到的世代發出新工作階段。
    const created = await createAuthSession(
        realm,
        {
            approvedBySessionId: decision.sessionId,
            factors: decision.factors,
            generation,
            principalId: decision.principalId,
            request,
        },
    );

    await recordAuthEvent(
        realm,
        {
            metadata: { approvedBySessionId: decision.sessionId },
            principalId: decision.principalId,
            request,
            sessionId: created.session.id,
            type: AuthEventType.LoginSuccess,
        },
    );

    return {
        created,
        state: 'completed',
    };
}

function toDecisionKey(realm: AuthRealm<any>, qrToken: string) {
    return authRedisKey(realm.name, 'qr-code-login-decision', sha256Hex(qrToken));
}

function toRequestKey(realm: AuthRealm<any>, qrToken: string) {
    return authRedisKey(realm.name, 'qr-code-login', sha256Hex(qrToken));
}
