import { AuthEventType } from '../../constants/auth';
import type {
    AuthOperationContext,
    AuthPrincipal,
    AuthRequestInfo,
} from '../../types/auth';
import { logger } from '../_internals/logger';

import { assertAuthIpAccess } from './access';
import {
    consumeAuthChallenge,
    createAuthChallenge,
    getAuthChallenge,
} from './challenge';
import { AuthError } from './error';
import { recordAuthEvent } from './event';
import {
    hasAuthPassword,
    verifyAuthPrincipalPassword,
} from './factor';
import {
    findAuthPrincipalSetting,
    hasAuthSecondFactor,
} from './principal-setting';
import {
    AuthRateLimitError,
    clearAuthAttempts,
    consumeAuthAttempt,
    consumeAuthPrincipalAttempt,
} from './rate-limit';
import type { AuthRealm } from './realm';
import {
    readAuthSessionGeneration,
    revokeAllAuthSessionsAround,
} from './session';

interface PasswordResetChallenge {
    /**
     * 建立時的工作階段世代。密碼每次寫入都會全部踢除而使世代前進，之前寄出的 token 隨之失效。
     */
    generation: number;
    principalId: string;
}

// Constants
const maxPasswordOverwriteAttempts = 3;

// Functions

/**
 * 本人變更密碼，成功後踢除全部工作階段（含 `sessionId` 所屬的目前裝置）。依 realm 的 `passwordChange` 分兩種：
 *
 * - `currentPassword`（預設）：必須輸入目前密碼，帳號有第二因子時另需高危操作驗證；只在密碼仍是剛驗證的那一個時寫入。
 * - `verification`，或帳號還沒有密碼：只需高危操作驗證，不比對目前密碼。
 *
 * `assertVerification` 消耗高危操作驗證的憑據；需要目前密碼時在確認密碼之後才呼叫，密碼錯誤不會白白用掉憑據。
 */
export async function changeAuthPassword<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    principal: P,
    sessionId: string,
    currentPassword: string | undefined,
    newPassword: string,
    request: AuthRequestInfo,
    assertVerification: () => Promise<void>,
) {
    const principalId = principal._id.toString();
    if (isAuthCurrentPasswordRequired(realm, principal)) {
        await consumeAuthPrincipalAttempt(realm, 'currentPasswordByPrincipal', principalId, 'password', request);
        if (currentPassword === undefined || !await verifyAuthPrincipalPassword(realm, principal, currentPassword)) {
            throw new AuthError('incorrectPassword');
        }

        await clearAuthAttempts(realm.name, 'currentPasswordByPrincipal', principalId);
        if (hasAuthSecondFactor(realm, await findAuthPrincipalSetting(realm, principalId))) await assertVerification();
        // 只在密碼仍是剛驗證的那一個時寫入：期間密碼已被其他請求變更（例如管理端重設）時，不可覆寫較新的密碼。
        // 沒寫入時以最新的帳號重新驗證一次：驗證時的自動 rehash 會換掉雜湊但密碼不變，此時以新的雜湊再寫一次。
        await revokeAllAuthSessionsAround(
            realm,
            principalId,
            async () => {
                if (await setAuthPassword(realm, principal, newPassword)) return;
                const reloadedPrincipal = await realm.findPrincipalById(principalId);
                if (
                    !reloadedPrincipal
                    || !await verifyAuthPrincipalPassword(realm, reloadedPrincipal, currentPassword)
                    || !await setAuthPassword(realm, reloadedPrincipal, newPassword)
                ) throw new AuthError('incorrectPassword');
            },
        );
    } else {
        await assertVerification();
        await overwriteAuthPassword(realm, principalId, newPassword);
    }

    await recordAuthEvent(
        realm,
        {
            principalId,
            request,
            sessionId,
            type: AuthEventType.PasswordChanged,
        },
    );
}

/**
 * 未登入的重設密碼第二步：以帳號收到的 token 設定新密碼並踢除全部工作階段。token 讀取即刪除，只能用一次。
 * 不發出工作階段，重設後仍要照常登入（含第二因子）。token 無效、帳號不存在或停用、
 * 寄出後帳號的工作階段曾被全部踢除（例如密碼已經變更）都回同一個錯誤。帳號的 IP 存取政策同樣適用。
 */
export async function completeAuthPasswordReset<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    token: string,
    newPassword: string,
    request: AuthRequestInfo,
) {
    const challenge = await consumeAuthChallenge<PasswordResetChallenge>(realm.name, 'passwordReset', token);
    if (!challenge || !await findPasswordResetPrincipal(realm, challenge)) throw new AuthError('challengeExpired');

    // 未登入的請求只以 scope 檢查過 IP 存取政策；知道是哪個帳號之後，帳號自己的政策也要通過。
    await assertAuthIpAccess(realm, request, challenge.principalId);
    await resetAuthPassword(realm, challenge.principalId, newPassword, { request });
}

/**
 * 重設密碼的挑戰所綁定的帳號；帳號不存在或停用、建立後帳號的工作階段曾被全部踢除時回傳 undefined。
 */
async function findPasswordResetPrincipal<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    challenge: PasswordResetChallenge,
) {
    const principal = await realm.findPrincipalById(challenge.principalId);
    if (
        principal
        && realm.isPrincipalActive(principal)
        && challenge.generation === await readAuthSessionGeneration(realm, challenge.principalId)
    ) return principal;
}

/**
 * 讀取重設密碼的 token 所綁定的帳號，不消耗 token，例如重設密碼頁顯示要重設的對象；
 * token 無效時回傳 undefined，條件與 `completeAuthPasswordReset` 相同（IP 存取政策除外）。
 */
export async function getAuthPasswordResetPrincipal<P extends AuthPrincipal>(realm: AuthRealm<P>, token: string) {
    const challenge = await getAuthChallenge<PasswordResetChallenge>(realm.name, 'passwordReset', token);
    return challenge && await findPasswordResetPrincipal(realm, challenge);
}

/**
 * 本人變更密碼是否要輸入目前密碼；否則只需高危操作驗證。
 */
export function isAuthCurrentPasswordRequired<P extends AuthPrincipal>(realm: AuthRealm<P>, principal: P) {
    return realm.passwordChange !== 'verification' && hasAuthPassword(realm, principal);
}

/**
 * 不比對目前密碼直接寫入新密碼，前後各踢除全部工作階段。寫入仍以「載入時的密碼」為條件，
 * 期間密碼被其他請求變更時以最新的帳號重試。
 */
async function overwriteAuthPassword(realm: AuthRealm<any>, principalId: string, password: string) {
    await revokeAllAuthSessionsAround(
        realm,
        principalId,
        async () => {
            for (let attempt = 0; attempt < maxPasswordOverwriteAttempts; attempt++) {
                const principal = await realm.findPrincipalById(principalId);
                if (!principal) throw new AuthError('invalidCredentials');
                if (await setAuthPassword(realm, principal, password)) return;
            }

            throw new Error('Auth principal password kept changing while being overwritten');
        },
    );
}

/**
 * 未登入的重設密碼第一步：把重設密碼的 token 寄給帳號。不論帳號是否存在、是否寄出都正常返回，
 * 也不等待寄送完成，回應不透露帳號是否存在。`origin` 是發起請求的前端來源（realm 的 `origins` 之一），
 * 交給 realm 組出重設密碼頁的連結。
 */
export async function requestAuthPasswordReset<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    rawIdentifier: string,
    request: AuthRequestInfo,
    origin: string,
) {
    const messenger = realm.messenger;
    if (!messenger) throw new AuthError('forbidden');
    await consumeAuthAttempt(realm.name, 'unauthenticatedChallengeByIp', request.ip ?? '');
    void (async () => {
        const principal = await realm.findPrincipalByIdentifier(rawIdentifier.trim());
        if (!principal || !realm.isPrincipalActive(principal)) return;
        const principalId = principal._id.toString();
        await consumeAuthAttempt(realm.name, 'passwordResetSendByPrincipal', principalId);
        await messenger.send(
            principal,
            {
                origin,
                purpose: 'passwordReset',
                token: await createAuthChallenge(
                    realm.name,
                    'passwordReset',
                    {
                        generation: await readAuthSessionGeneration(realm, principalId),
                        principalId,
                    } satisfies PasswordResetChallenge,
                ),
            },
        );
    })().catch((error) => {
        // 寄送次數超過門檻是預期內的結果。
        if (error instanceof AuthRateLimitError) return;
        logger.error(
            'Failed to send auth password reset token',
            {
                error,
                realm: realm.name,
            },
        );
    });
}

/**
 * 重設帳號的密碼（不比對目前密碼）並踢除全部工作階段，例如未登入的重設密碼；`context` 記錄操作者與請求。
 */
export async function resetAuthPassword(
    realm: AuthRealm<any>,
    principalId: string,
    newPassword: string,
    context: AuthOperationContext,
) {
    await overwriteAuthPassword(realm, principalId, newPassword);
    await recordAuthEvent(
        realm,
        {
            ...context,
            principalId,
            type: AuthEventType.PasswordReset,
        },
    );
}

async function setAuthPassword<P extends AuthPrincipal>(realm: AuthRealm<P>, principal: P, password: string) {
    if (realm.setPassword) return await realm.setPassword(principal, password);
    const updateResult = await realm.model.updateOne(
        {
            _id: principal._id,
            password: (principal as P & { password?: string }).password ?? null,
        },
        { $set: { password } },
    );

    return updateResult.matchedCount === 1;
}
