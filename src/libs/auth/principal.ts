import { deleteAuthPrincipalSetting } from './principal-setting';
import type { AuthRealm } from './realm';
import { revokeAllAuthSessions } from './session';

// Functions

/**
 * 帳號被刪除時清除其 auth 資料：踢除全部工作階段並刪除帳號設定。安全性事件保留作為稽核紀錄。
 */
export async function deleteAuthPrincipalData(realm: AuthRealm<any>, principalId: string) {
    await revokeAllAuthSessions(realm, principalId);
    await deleteAuthPrincipalSetting(realm, principalId);
}
