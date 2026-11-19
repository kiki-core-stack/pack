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
import { verifyPasswordWithArgon2 } from '../password-argon2';

import { verifyAuthCode } from './code';
import { AuthError } from './error';
import { recordAuthEvent } from './event';
import { verifyAuthPasskeyAuthentication } from './passkey/server';
import {
    findAuthPrincipalSetting,
    listAuthSecondFactors,
} from './principal-setting';
import {
    AuthRateLimitError,
    clearAuthAttempts,
    consumeAuthPrincipalAttempt,
    recordAuthRateLimitAround,
} from './rate-limit';
import type { AuthRealm } from './realm';
import { hashAuthRecoveryCode } from './recovery-code';
import {
    decryptAuthSecret,
    encryptAuthSecret,
} from './secret-encryption';
import { verifyAuthTotpCode } from './totp';

export type AuthFactorProof =
  | {
      challengeId: string;
      factor: 'passkey';
      response: AuthenticationResponseJSON;
  }
  | {
      code: string;
      factor: 'code';
  }
  | {
      code: string;
      factor: 'recoveryCode' | 'totp';
  }
  | {
      factor: 'password';
      password: string;
  };

// Constants

// 密碼、驗證碼與第二因子分開計數：其中一種通過不能清除另一種的猜測次數。驗證碼由 `verifyAuthCode` 自行計數。
const proofFactorToAttemptKindMap = {
    passkey: 'secondFactorByPrincipal',
    password: 'currentPasswordByPrincipal',
    recoveryCode: 'secondFactorByPrincipal',
    totp: 'secondFactorByPrincipal',
} as const satisfies Record<Exclude<AuthFactorProof['factor'], 'code'>, string>;

// Functions

/**
 * 帳號是否已設定密碼。realm 沒有提供 `hasPassword` 時看帳號文件的 `password`；自訂 `verifyPassword` 的 realm
 * 密碼不一定存在該欄位，一律視為有。
 */
export function hasAuthPassword<P extends AuthPrincipal>(realm: AuthRealm<P>, principal: P) {
    if (realm.hasPassword) return realm.hasPassword(principal);
    return !!realm.verifyPassword || !!(principal as P & { password?: string }).password;
}

/**
 * 帳號可用來通過高危操作驗證的因子：已綁定的第二因子；沒有任何第二因子時，改用 realm 寄出的驗證碼
 * （realm 有寄送通道時）或密碼（帳號有密碼時）。
 */
export function listAuthVerificationFactors<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    principal: P,
    setting?: AuthPrincipalSetting,
) {
    const factors: AuthFactor[] = listAuthSecondFactors(realm, setting);
    if (factors.length) return factors;
    if (realm.messenger) factors.push('code');
    if (hasAuthPassword(realm, principal)) factors.push('password');
    return factors;
}

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

export function toAuthTotpSecretContext(realm: AuthRealm<any>, principalId: string) {
    return `totp:${realm.name}:${principalId}`;
}

/**
 * 驗證因子，登入的第二步與高危操作驗證共用；成功回傳所使用的因子，失敗拋出 `AuthError`。
 *
 * - 登入的第二步可用 passkey、TOTP、救援碼；高危操作驗證可用的因子見 `listAuthVerificationFactors`。
 * - 先計數再驗證，以帳號為維度（驗證碼由 `verifyAuthCode` 計數）；成功後清除計數。
 *   第一次超過門檻時寫入一筆 `RateLimited` 事件。
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
        const attemptKind = proof.factor === 'code' ? undefined : proofFactorToAttemptKindMap[proof.factor];
        if (attemptKind) await consumeAuthPrincipalAttempt(realm, attemptKind, principalId, proof.factor, request);
        const setting = await findAuthPrincipalSetting(realm, principalId);
        const usableFactors: AuthFactor[] = purpose === 'verification'
            ? listAuthVerificationFactors(realm, principal, setting)
            : listAuthSecondFactors(realm, setting);

        const failure = new AuthError(proof.factor === 'password' ? 'incorrectPassword' : 'invalidVerificationCode');
        // 驗證碼由 `verifyAuthCode` 計數，因此先驗證再看是否可用：不可用的驗證碼同樣受限流。
        const isCodeValid = proof.factor === 'code' && await recordAuthRateLimitAround(
            realm,
            principalId,
            proof.factor,
            request,
            async () => await verifyAuthCode(realm.name, 'verification', principalId, proof.code),
        );

        if (!usableFactors.includes(proof.factor)) throw failure;
        // 第二因子列在可用的因子內時，帳號設定必定存在。
        switch (proof.factor) {
            case 'code':
                if (!isCodeValid) throw failure;
                break;
            case 'passkey':
                await verifyAuthPasskeyAuthentication(realm, purpose, setting!, proof.challengeId, proof.response);
                break;
            case 'password':
                if (!await verifyAuthPrincipalPassword(realm, principal, proof.password)) throw failure;
                break;
            case 'recoveryCode':
                await verifyRecoveryCode(setting!, proof.code);
                break;
            case 'totp':
                await verifyTotp(realm, setting!, proof.code);
                break;
        }

        if (attemptKind) await clearAuthAttempts(realm.name, attemptKind, principalId);
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

/**
 * 驗證帳號的密碼。帳號沒有密碼時以 dummy hash 維持相同耗時後回傳 false。
 */
export async function verifyAuthPrincipalPassword<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    principal: P,
    password: string,
) {
    if (!hasAuthPassword(realm, principal)) return await verifyPasswordWithArgon2(undefined, password);
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
