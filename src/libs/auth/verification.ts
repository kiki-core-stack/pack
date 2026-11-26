import type { AuthSentCodeData } from '../../types/data/auth';

import {
    consumeAuthChallenge,
    createAuthChallenge,
} from './challenge';
import { createAuthCode } from './code';
import { AuthError } from './error';
import {
    listAuthVerificationFactors,
    verifyAuthFactor,
} from './factor';
import type { AuthFactorProof } from './factor';
import { findAuthPrincipalSetting } from './principal-setting';
import type { AuthRealm } from './realm';
import type {
    AuthPrincipal,
    AuthRequestInfo,
    AuthSession,
} from './types';

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

    const principal = await realm.findPrincipalById(session.principalId);
    if (!principal) throw new AuthError('sessionInvalid');
    throw new AuthError(
        'verificationRequired',
        {
            data: {
                factors: listAuthVerificationFactors(
                    realm,
                    principal,
                    await findAuthPrincipalSetting(realm, session.principalId),
                ),
                operation,
            },
        },
    );
}

/**
 * 高危操作驗證：以因子驗證本人後發出一次性憑據，綁定工作階段與操作名稱、沒有放行期。
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

/**
 * 寄出高危操作驗證用的驗證碼。驗證碼不是這個帳號可用的因子、或帳號沒有可用的收件位址時拋出
 * `verificationCodeUnavailable`。
 */
export async function sendAuthVerificationCode<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    session: AuthSession,
): Promise<AuthSentCodeData> {
    const principal = await realm.findPrincipalById(session.principalId);
    if (!principal) throw new AuthError('sessionInvalid');
    const setting = await findAuthPrincipalSetting(realm, session.principalId);
    if (!realm.messenger || !listAuthVerificationFactors(realm, principal, setting).includes('code')) {
        throw new AuthError('verificationCodeUnavailable');
    }

    // 沒寄出的驗證碼沒有人知道，留到過期即可。
    const code = await createAuthCode(realm.name, 'verification', session.principalId);
    if (
        !await realm.messenger.send(
            principal,
            {
                code,
                purpose: 'verification',
            },
        )
    ) throw new AuthError('verificationCodeUnavailable');

    return { destinationHint: realm.messenger.getDestinationHint?.(principal) };
}
