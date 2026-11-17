import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';

import { AuthEventType } from '../../constants/auth';
import { AuthPrincipalSettingModel } from '../../models/auth/principal-setting';
import type { AuthPrincipalSetting } from '../../models/auth/principal-setting';
import type {
    AuthFactor,
    AuthPrincipal,
    AuthRequestInfo,
} from '../../types/auth';

import { AuthError } from './error';
import { recordAuthEvent } from './event';
import { verifyAuthPasskeyAuthentication } from './passkey';
import {
    findAuthPrincipalSetting,
    hasAuthSecondFactor,
    listAuthSecondFactors,
} from './principal-setting';
import {
    AuthRateLimitError,
    clearAuthAttempts,
    consumeAuthPrincipalAttempt,
} from './rate-limit';
import type { AuthRealm } from './realm';
import { hashAuthRecoveryCode } from './recovery-code';
import {
    decryptAuthSecret,
    encryptAuthSecret,
} from './secret-encryption';
import { verifyAuthTotpCode } from './totp';

/**
 * 用戶端提出的因子證明。
 */
export type AuthFactorProof =
  | {
      challengeId: string;
      factor: 'passkey';
      response: AuthenticationResponseJSON;
  }
  | {
      code: string;
      factor: 'recoveryCode' | 'totp';
  }
  | {
      factor: 'password';
      password: string;
  };

// Functions

/**
 * 寫入驗證失敗的事件。超過嘗試次數的失敗已在計數時記錄過一次，這裡不再重複寫入。
 */
export async function recordAuthFailure(
    realm: AuthRealm<any>,
    type: AuthEventType.LoginFailure | AuthEventType.VerificationFailure,
    principalId: string,
    factor: AuthFactor,
    request: AuthRequestInfo,
    error: unknown,
) {
    if (error instanceof AuthRateLimitError) return;
    await recordAuthEvent(
        realm,
        {
            factor,
            metadata: error instanceof AuthError ? { reason: error.code } : undefined,
            principalId,
            request,
            type,
        },
    );
}

/**
 * 加密 TOTP 密鑰時綁定的用途與擁有者。
 */
export function toAuthTotpSecretContext(realm: AuthRealm<any>, principalId: string) {
    return `totp:${realm.name}:${principalId}`;
}

/**
 * 驗證因子，登入的第二步與高危操作驗證共用；成功回傳所使用的因子，失敗拋出 `AuthError`。
 *
 * - 可用的因子為 passkey、TOTP、救援碼；帳號沒有任何第二因子時，高危操作驗證改用密碼。
 * - 先計數再驗證，以帳號為維度；成功後清除計數。第一次超過門檻時寫入一筆 `RateLimited` 事件。
 * - 失敗時寫入事件：登入的第二步記為 `LoginFailure`，高危操作驗證記為 `VerificationFailure`。
 */
export async function verifyAuthFactor<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    principal: P,
    purpose: 'secondFactor' | 'verification',
    proof: AuthFactorProof,
    request: AuthRequestInfo,
): Promise<AuthFactor> {
    const principalId = principal._id.toString();
    try {
        // 密碼與第二因子分開計數：密碼正確不能清除第二因子的猜測次數。
        const attemptKind = proof.factor === 'password' ? 'currentPasswordByPrincipal' : 'secondFactorByPrincipal';
        await consumeAuthPrincipalAttempt(realm, attemptKind, principalId, proof.factor, request);
        const setting = await findAuthPrincipalSetting(realm, principalId);
        if (proof.factor === 'password') {
            if (purpose !== 'verification' || hasAuthSecondFactor(realm, setting)) throw new AuthError('incorrectPassword');
            if (!await verifyAuthPrincipalPassword(realm, principal, proof.password)) throw new AuthError('incorrectPassword');
        } else {
            if (!setting || !listAuthSecondFactors(realm, setting).includes(proof.factor)) {
                throw new AuthError('invalidVerificationCode');
            }

            switch (proof.factor) {
                case 'passkey':
                    await verifyAuthPasskeyAuthentication(realm, purpose, setting, proof.challengeId, proof.response);
                    break;
                case 'recoveryCode':
                    await verifyRecoveryCode(setting, proof.code);
                    break;
                case 'totp':
                    await verifyTotp(realm, setting, proof.code);
                    break;
            }
        }

        await clearAuthAttempts(realm.name, attemptKind, principalId);
        return proof.factor;
    } catch (error) {
        await recordAuthFailure(
            realm,
            purpose === 'secondFactor' ? AuthEventType.LoginFailure : AuthEventType.VerificationFailure,
            principalId,
            proof.factor,
            request,
            error,
        );

        throw error;
    }
}

export async function verifyAuthPrincipalPassword<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    principal: P,
    password: string,
) {
    if (realm.verifyPassword) return await realm.verifyPassword(principal, password);
    return await (principal as P & { verifyPassword: (password: string) => Promise<boolean> }).verifyPassword(password);
}

// 尚未使用才標記為已使用；並行使用同一組救援碼只有一個能通過。
async function verifyRecoveryCode(setting: AuthPrincipalSetting, code: string) {
    const updateResult = await AuthPrincipalSettingModel.updateOne(
        {
            _id: setting._id,
            recoveryCodes: {
                $elemMatch: {
                    hash: hashAuthRecoveryCode(code),
                    usedAt: { $exists: false },
                },
            },
        },
        { $set: { 'recoveryCodes.$.usedAt': new EnhancedDate() } },
    );

    if (updateResult.modifiedCount !== 1) throw new AuthError('invalidVerificationCode');
}

async function verifyTotp(realm: AuthRealm<any>, setting: AuthPrincipalSetting, code: string) {
    const context = toAuthTotpSecretContext(realm, setting.principalId.toString());
    // 找不到對應的加密金鑰時視為無法驗證，使用者改用 passkey 或救援碼，或由有管理權限者重設。
    const secret = setting.totp && decryptAuthSecret(setting.totp.secret, context);
    const step = secret && verifyAuthTotpCode(secret.value, code);
    if (!secret || step === undefined) throw new AuthError('invalidVerificationCode');

    // 目前值小於新值才更新：同一步或更早的驗證碼一律拒絕，並行送出的同一組驗證碼只有一個能通過。
    // 密鑰也必須仍是剛驗證的那一個：期間被移除或重新綁定時，這次驗證不算數，也不會把舊密鑰寫回。
    const updateResult = await AuthPrincipalSettingModel.updateOne(
        {
            '_id': setting._id,
            'totp.lastUsedStep': { $lt: step },
            'totp.secret': setting.totp!.secret,
        },
        {
            $set: {
                'totp.lastUsedStep': step,
                // 密文不是用第一把金鑰加密時，順便改用第一把重新加密。
                ...secret.outdated && { 'totp.secret': encryptAuthSecret(secret.value, context) },
            },
        },
    );

    if (updateResult.modifiedCount !== 1) throw new AuthError('invalidVerificationCode');
}
