import { AuthEventType } from '../../constants/auth';
import type {
    AuthPrincipal,
    AuthRequestInfo,
    AuthSession,
} from '../../types/auth';

import { AuthError } from './error';
import { recordAuthEvent } from './event';
import { verifyAuthPrincipalPassword } from './factor';
import {
    clearAuthAttempts,
    consumeAuthPrincipalAttempt,
} from './rate-limit';
import type { AuthRealm } from './realm';
import { revokeOtherAuthSessions } from './session';

// Functions

/**
 * 變更密碼：一律要輸入目前密碼，且只在密碼仍是剛驗證的那一個時寫入。成功後踢除全部工作階段，並為目前裝置換發新的工作階段。
 *
 * `assertAuthorized` 在確認目前密碼之後、寫入新密碼之前呼叫，用來檢查其餘前置條件（例如消耗高危操作驗證的憑據）；
 * 拋出錯誤即中止。
 */
export async function changeAuthPassword<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    principal: P,
    session: AuthSession,
    currentPassword: string,
    newPassword: string,
    request: AuthRequestInfo,
    assertAuthorized?: () => Promise<void>,
) {
    const principalId = principal._id.toString();
    await consumeAuthPrincipalAttempt(realm, 'currentPasswordByPrincipal', principalId, 'password', request);
    if (!await verifyAuthPrincipalPassword(realm, principal, currentPassword)) throw new AuthError('incorrectPassword');
    await clearAuthAttempts(realm.name, 'currentPasswordByPrincipal', principalId);
    await assertAuthorized?.();
    // 只在密碼仍是剛驗證的那一個時寫入：期間密碼已被其他請求變更（例如管理端重設）時，不可覆寫較新的密碼。
    // 沒寫入時以最新的帳號重新驗證一次：驗證時的自動 rehash 會換掉雜湊但密碼不變，此時以新的雜湊再寫一次。
    if (!await setAuthPassword(realm, principal, newPassword)) {
        const reloadedPrincipal = await realm.findPrincipalById(principalId);
        if (
            !reloadedPrincipal
            || !await verifyAuthPrincipalPassword(realm, reloadedPrincipal, currentPassword)
            || !await setAuthPassword(realm, reloadedPrincipal, newPassword)
        ) throw new AuthError('incorrectPassword');
    }

    await recordAuthEvent(
        realm,
        {
            principalId,
            request,
            sessionId: session.id,
            type: AuthEventType.PasswordChanged,
        },
    );

    return await revokeOtherAuthSessions(realm, session, request);
}

async function setAuthPassword<P extends AuthPrincipal>(realm: AuthRealm<P>, principal: P, password: string) {
    if (realm.setPassword) return await realm.setPassword(principal, password);
    const updateResult = await realm.model.updateOne(
        {
            _id: principal._id,
            password: (principal as P & { password: string }).password,
        },
        { $set: { password } },
    );

    return updateResult.matchedCount === 1;
}
