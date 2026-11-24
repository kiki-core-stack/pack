import type {
    Types,
    UpdateQuery,
} from 'mongoose';
import type { Promisable } from 'type-fest';

import { AuthPrincipalSettingModel } from '../../models/auth/principal-setting';
import type { AuthPrincipalSetting } from '../../models/auth/principal-setting';
import type { AuthSecondFactor } from '../../types/auth';

import { generateRandomToken } from './_internals/crypto';
import type { AuthRealm } from './realm';

export interface AuthPrincipalSettingMutation<Result> {
    result: Result;

    /**
     * 要寫入的更新；省略表示不需要寫入。
     */
    update?: UpdateQuery<AuthPrincipalSetting>;
}

// Constants
const maxMutationAttempts = 5;

// Functions
export async function deleteAuthPrincipalSetting(realm: AuthRealm<any>, principalId: string | Types.ObjectId) {
    await AuthPrincipalSettingModel.deleteOne({
        principalId,
        realm: realm.name,
    });
}

/**
 * 讀取帳號設定；尚未建立時回傳 undefined，視為全部預設值。
 */
export async function findAuthPrincipalSetting(realm: AuthRealm<any>, principalId: string | Types.ObjectId) {
    return await AuthPrincipalSettingModel
        .findOne({
            principalId,
            realm: realm.name,
        })
        .lean<AuthPrincipalSetting>() ?? undefined;
}

/**
 * 讀取帳號設定，不存在時建立；建立時一律產生 WebAuthn user handle。
 */
export async function getOrCreateAuthPrincipalSetting(realm: AuthRealm<any>, principalId: string | Types.ObjectId) {
    return await AuthPrincipalSettingModel
        .findOneAndUpdate(
            {
                principalId,
                realm: realm.name,
            },
            { $setOnInsert: { webauthnUserHandle: generateRandomToken() } },
            {
                returnDocument: 'after',
                upsert: true,
            },
        )
        .lean<AuthPrincipalSetting>();
}

/**
 * 帳號是否已綁定可獨立使用的第二因子（passkey 或 TOTP）；救援碼只是它們的備援。
 */
export function hasAuthSecondFactor(realm: AuthRealm<any>, setting?: AuthPrincipalSetting) {
    return !!setting && (!!setting.totp || (!!realm.webauthn && setting.passkeys.length > 0));
}

export async function isAuthTwoFactorRequired(realm: AuthRealm<any>, setting?: AuthPrincipalSetting) {
    return (await realm.getConfig()).twoFactorRequired || !!setting?.twoFactorEnforced || !!setting?.twoFactorEnabled;
}

export function listAuthSecondFactors(realm: AuthRealm<any>, setting?: AuthPrincipalSetting) {
    const factors: AuthSecondFactor[] = [];
    if (!setting || !hasAuthSecondFactor(realm, setting)) return factors;
    if (realm.webauthn && setting.passkeys.length) factors.push('passkey');
    if (setting.totp) factors.push('totp');
    if (setting.recoveryCodes.some((recoveryCode) => !recoveryCode.usedAt)) factors.push('recoveryCode');
    return factors;
}

/**
 * 變更「有哪些因子、是否開啟或被強制」的唯一入口：讀取設定、由 `mutate` 依讀到的內容判斷並決定更新，
 * 再以 `revision` 為條件寫入；期間設定被其他請求改過時，以最新的設定重新判斷。
 * 因此 `mutate` 內的前置條件（例如「不可移除最後一個第二因子」）在並行請求下仍然成立。`mutate` 可拋出錯誤中止。
 *
 * 登入時的原子更新（TOTP 時間步、救援碼使用、passkey 計數器）不影響上述判斷，不經過這裡。
 */
export async function mutateAuthPrincipalSetting<Result>(
    realm: AuthRealm<any>,
    principalId: string | Types.ObjectId,
    mutate: (setting: AuthPrincipalSetting) => Promisable<AuthPrincipalSettingMutation<Result>>,
) {
    for (let attempt = 0; attempt < maxMutationAttempts; attempt++) {
        const setting = await getOrCreateAuthPrincipalSetting(realm, principalId);
        const { result, update } = await mutate(setting);
        if (!update) return result;
        const updateResult = await AuthPrincipalSettingModel.updateOne(
            {
                _id: setting._id,
                revision: setting.revision,
            },
            {
                ...update,
                $inc: { revision: 1 },
            },
        );

        if (updateResult.modifiedCount === 1) return result;
    }

    throw new Error('Auth principal setting kept changing while being updated');
}
