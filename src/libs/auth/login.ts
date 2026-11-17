import type { AuthenticationResponseJSON } from '@simplewebauthn/server';

import { AuthEventType } from '../../constants/auth';
import type {
    AuthFactor,
    AuthPrincipal,
    AuthRequestInfo,
    AuthSecondFactor,
} from '../../types/auth';
import { verifyPasswordWithArgon2 } from '../password-argon2';

import { assertAuthIpAccess } from './access';
import {
    createAuthChallenge,
    deleteAuthChallenge,
    getAuthChallenge,
} from './challenge';
import { AuthError } from './error';
import { recordAuthEvent } from './event';
import {
    recordAuthFailure,
    verifyAuthFactor,
    verifyAuthPrincipalPassword,
} from './factor';
import type { AuthFactorProof } from './factor';
import {
    findAuthPrincipalSettingByPasskeyResponse,
    verifyAuthPasskeyAuthentication,
} from './passkey';
import {
    findAuthPrincipalSetting,
    hasAuthSecondFactor,
    isAuthTwoFactorRequired,
    listAuthSecondFactors,
} from './principal-setting';
import {
    AuthRateLimitError,
    clearAuthAttempts,
    consumeAuthAttempt,
} from './rate-limit';
import type { AuthRealm } from './realm';
import {
    createAuthSession,
    readAuthSessionGeneration,
} from './session';
import type { CreatedAuthSession } from './session';

export type AuthLoginOutcome =
  | {
      challengeId: string;
      factors: AuthSecondFactor[];
      state: 'secondFactorRequired';
  }
  | {
      created: CreatedAuthSession;
      state: 'completed';
  };

interface SecondFactorChallenge {
    /**
     * 驗證密碼之前讀到的世代；第二步以此建立工作階段。
     */
    generation: number;
    principalId: string;
}

// Constants
const maxIdentifierLength = 256;

// Functions

/**
 * 以登入的第二步完成登入。驗證失敗不消耗挑戰，可在有效期與限流範圍內重試；
 * 驗證通過後以「刪除挑戰成功」作為唯一的放行條件，同一個挑戰只能成功一次。
 */
export async function completeAuthSecondFactorLogin<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    challengeId: string,
    proof: Exclude<AuthFactorProof, { factor: 'password' }>,
    request: AuthRequestInfo,
): Promise<AuthLoginOutcome> {
    const challenge = await getAuthChallenge<SecondFactorChallenge>(realm.name, 'secondFactor', challengeId);
    if (!challenge) throw new AuthError('challengeExpired');
    const principal = await realm.findPrincipalById(challenge.principalId);
    if (!principal || !realm.isPrincipalActive(principal)) throw new AuthError('invalidCredentials');

    const factor = await verifyAuthFactor(realm, principal, 'secondFactor', proof, request);

    if (!await deleteAuthChallenge(realm.name, 'secondFactor', challengeId)) throw new AuthError('challengeExpired');
    return await issueAuthSession(
        realm,
        challenge.principalId,
        challenge.generation,
        [
            'password',
            factor,
        ],
        request,
    );
}

/**
 * 讀取登入第二步的挑戰所綁定的帳號，例如產生第二因子用的 passkey 選項。
 */
export async function getAuthSecondFactorChallengePrincipalId(realm: AuthRealm<any>, challengeId: string) {
    const challenge = await getAuthChallenge<SecondFactorChallenge>(realm.name, 'secondFactor', challengeId);
    if (!challenge) throw new AuthError('challengeExpired');
    return challenge.principalId;
}

/**
 * 發出工作階段：確認 IP 存取政策、建立工作階段並寫入登入成功事件。
 * 需要雙重驗證但尚未綁定任何第二因子的帳號只發受限工作階段。
 */
async function issueAuthSession(
    realm: AuthRealm<any>,
    principalId: string,
    generation: number,
    factors: AuthFactor[],
    request: AuthRequestInfo,
    restricted = false,
): Promise<AuthLoginOutcome> {
    await assertAuthIpAccess(realm, request, principalId);
    const created = await createAuthSession(
        realm,
        {
            factors,
            generation,
            principalId,
            request,
            restricted,
        },
    );

    await recordAuthEvent(
        realm,
        {
            factor: factors.at(-1),
            metadata: restricted ? { restricted } : undefined,
            principalId,
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

/**
 * 以 passkey 登入：使用 discoverable credential，不需先輸入帳號；要求使用者驗證，通過即視同已滿足雙重驗證。
 */
export async function loginWithAuthPasskey<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    challengeId: string,
    response: AuthenticationResponseJSON,
    request: AuthRequestInfo,
): Promise<AuthLoginOutcome> {
    // user handle 尚未經過驗證，只用來在驗證前找出帳號並讀取世代。
    const setting = await findAuthPrincipalSettingByPasskeyResponse(realm, response);
    if (!setting) throw new AuthError('passkeyVerificationFailed');
    const principalId = setting.principalId.toString();
    const generation = await readAuthSessionGeneration(realm, principalId);
    try {
        await verifyAuthPasskeyAuthentication(realm, 'login', setting, challengeId, response);
    } catch (error) {
        await recordAuthFailure(realm, AuthEventType.LoginFailure, principalId, 'passkey', request, error);
        throw error;
    }

    const principal = await realm.findPrincipalById(principalId);
    if (!principal || !realm.isPrincipalActive(principal)) throw new AuthError('invalidCredentials');
    return await issueAuthSession(realm, principalId, generation, ['passkey'], request);
}

/**
 * 以密碼登入。帳號不存在、密碼錯誤、帳號停用回同一個錯誤，並以 dummy hash 維持相同耗時。
 * 需要第二因子時回傳 `secondFactor` 挑戰，否則直接發出工作階段。
 */
export async function loginWithAuthPassword<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    rawIdentifier: string,
    password: string,
    request: AuthRequestInfo,
): Promise<AuthLoginOutcome> {
    const identifier = rawIdentifier.trim().slice(0, maxIdentifierLength);
    // 轉小寫後再作為限流的 key；不論帳號是否存在都計數，回應不因帳號存在與否而不同。
    const attemptsKey = identifier.toLowerCase();
    const identifierAndIp = `${attemptsKey}:${request.ip}`;
    try {
        await consumeAuthAttempt(realm.name, 'passwordByIdentifierAndIp', identifierAndIp);
        await consumeAuthAttempt(realm.name, 'passwordByIdentifier', attemptsKey);
    } catch (error) {
        // 第一次超過門檻時才查帳號並記錄，之後被擋下的請求不再讀寫資料庫。
        const principal = error instanceof AuthRateLimitError && error.first
            ? await realm.findPrincipalByIdentifier(identifier)
            : null;

        if (principal) {
            await recordAuthEvent(
                realm,
                {
                    factor: 'password',
                    principalId: principal._id.toString(),
                    request,
                    type: AuthEventType.RateLimited,
                },
            );
        }

        throw error;
    }

    // 世代必須早於「用來驗證的密碼雜湊」讀取：先以帳號找出 ID、讀取世代，再重新載入帳號。
    // 否則在載入與讀取世代之間變更密碼並全部踢除，舊密碼仍能取得新世代的工作階段。
    const identifiedPrincipal = await realm.findPrincipalByIdentifier(identifier);
    const generation = identifiedPrincipal
        ? await readAuthSessionGeneration(realm, identifiedPrincipal._id.toString())
        : 0;

    const principal = identifiedPrincipal && await realm.findPrincipalById(identifiedPrincipal._id.toString());
    const passwordVerified = principal
        ? await verifyAuthPrincipalPassword(realm, principal, password)
        : await verifyPasswordWithArgon2(undefined, password);

    if (!principal || !passwordVerified || !realm.isPrincipalActive(principal)) {
        if (principal) {
            await recordAuthFailure(
                realm,
                AuthEventType.LoginFailure,
                principal._id.toString(),
                'password',
                request,
                new AuthError('invalidCredentials'),
            );
        }

        throw new AuthError('invalidCredentials');
    }

    const principalId = principal._id.toString();
    await clearAuthAttempts(realm.name, 'passwordByIdentifierAndIp', identifierAndIp);
    const setting = await findAuthPrincipalSetting(realm, principalId);
    if (!await isAuthTwoFactorRequired(realm, setting)) {
        return await issueAuthSession(realm, principalId, generation, ['password'], request);
    }

    // 被強制但尚未綁定任何第二因子：只發受限工作階段，綁定完成後才換發正常工作階段。
    if (!hasAuthSecondFactor(realm, setting)) {
        return await issueAuthSession(realm, principalId, generation, ['password'], request, true);
    }

    await assertAuthIpAccess(realm, request, principalId);
    return {
        challengeId: await createAuthChallenge(
            realm.name,
            'secondFactor',
            {
                generation,
                principalId,
            } satisfies SecondFactorChallenge,
        ),
        factors: listAuthSecondFactors(realm, setting),
        state: 'secondFactorRequired',
    };
}
