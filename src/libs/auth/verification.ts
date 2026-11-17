import type {
    AuthFactor,
    AuthPrincipal,
    AuthRequestInfo,
    AuthSession,
} from '../../types/auth';

import {
    consumeAuthChallenge,
    createAuthChallenge,
} from './challenge';
import { AuthError } from './error';
import { verifyAuthFactor } from './factor';
import type { AuthFactorProof } from './factor';
import {
    findAuthPrincipalSetting,
    listAuthSecondFactors,
} from './principal-setting';
import type { AuthRealm } from './realm';

interface VerificationGrant {
    operation: string;
    principalId: string;
    sessionId: string;
}

// Functions

/**
 * 檢查並消耗高危操作驗證的一次性憑據：讀取即刪除，必須綁定同一個工作階段與操作名稱，否則拋出 `verificationRequired`，
 * 並帶上操作名稱與帳號可用來驗證的因子。
 */
export async function consumeAuthVerificationGrant(
    realm: AuthRealm<any>,
    session: AuthSession,
    operation: string,
    grantId?: string,
) {
    const grant = grantId
        ? await consumeAuthChallenge<VerificationGrant>(realm.name, 'verificationGrant', grantId)
        : undefined;

    if (
        grant
        && grant.operation === operation
        && grant.principalId === session.principalId
        && grant.sessionId === session.id
    ) return;

    // 帳號沒有任何第二因子時改用密碼驗證。
    const factors: AuthFactor[] = listAuthSecondFactors(
        realm,
        await findAuthPrincipalSetting(realm, session.principalId),
    );

    throw new AuthError(
        'verificationRequired',
        {
            data: {
                factors: factors.length ? factors : ['password'],
                operation,
            },
        },
    );
}

/**
 * 高危操作驗證：以因子驗證本人後發出一次性憑據，綁定工作階段與操作名稱、有效 2 分鐘、沒有放行期。
 * 操作名稱可帶目標 ID（例如 `deleteProject:<id>`），讓憑據只對該目標有效。
 */
export async function createAuthVerificationGrant<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    session: AuthSession,
    operation: string,
    proof: AuthFactorProof,
    request: AuthRequestInfo,
) {
    const principal = await realm.findPrincipalById(session.principalId);
    if (!principal) throw new AuthError('sessionInvalid');
    await verifyAuthFactor(realm, principal, 'verification', proof, request);
    return await createAuthChallenge(
        realm.name,
        'verificationGrant',
        {
            operation,
            principalId: session.principalId,
            sessionId: session.id,
        } satisfies VerificationGrant,
    );
}
