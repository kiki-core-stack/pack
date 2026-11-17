import type { AuthRequestInfo } from '../../types/auth';
import { checkPlatformIpAccessPolicy } from '../platform/ip-access-policy';

import { AuthError } from './error';
import type { AuthRealm } from './realm';

// Functions

/**
 * 以 realm 的 scope（與帳號，若已識別）檢查 IP 存取政策；不允許時拋出 `forbidden`。
 */
export async function assertAuthIpAccess(realm: AuthRealm<any>, request: AuthRequestInfo, principalId?: string) {
    const result = await checkPlatformIpAccessPolicy(request.ip, realm.scope, principalId);
    if (!result.allowed) throw new AuthError('forbidden');
}
