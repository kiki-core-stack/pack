import type {
    AuthRequestInfo,
    AuthSession,
} from '../../types/auth';
import { checkPlatformIpAccessPolicy } from '../platform/ip-access-policy';

import { AuthError } from './error';
import type { AuthRealm } from './realm';
import { authenticateAuthSession } from './session';

// Functions
export async function assertAuthIpAccess(realm: AuthRealm<any>, request: AuthRequestInfo, principalId?: string) {
    const result = await checkPlatformIpAccessPolicy(request.ip, realm.scope, principalId);
    if (!result.allowed) throw new AuthError('forbidden');
}

/**
 * 驗證長連線（例如 ws.io）所帶的 token，供握手與連線期間的定期重新驗證使用。
 * 無效時回傳 undefined，IP 不允許時拋出 `forbidden`。
 *
 * 不順延工作階段：連線存活不算活動，閒置逾時只看 HTTP 請求。`Origin` 檢查由接受連線的服務在握手時自行處理。
 */
export async function authenticateAuthConnection(
    realm: AuthRealm<any>,
    token: string,
    request: AuthRequestInfo,
): Promise<AuthSession | undefined> {
    const session = await authenticateAuthSession(realm, token);
    if (!session || session.restricted) return;
    await assertAuthIpAccess(realm, request, session.principalId);
    return session;
}
