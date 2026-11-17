import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import type { UpdateQuery } from 'mongoose';

import { AuthEventType } from '../../constants/auth';
import { AuthPrincipalSettingModel } from '../../models/auth/principal-setting';
import type { AuthPrincipalSetting } from '../../models/auth/principal-setting';
import type {
    AuthOperationContext,
    AuthPrincipal,
} from '../../types/auth';
import type { AuthSecurityOverviewData } from '../../types/data/auth';

import {
    createAuthChallenge,
    deleteAuthChallenge,
    getAuthChallenge,
} from './challenge';
import { AuthError } from './error';
import { recordAuthEvent } from './event';
import { toAuthTotpSecretContext } from './factor';
import {
    maxAuthPasskeysPerPrincipal,
    verifyAuthPasskeyRegistration,
} from './passkey';
import {
    findAuthPrincipalSetting,
    hasAuthSecondFactor,
    mutateAuthPrincipalSetting,
} from './principal-setting';
import {
    clearAuthAttempts,
    consumeAuthPrincipalAttempt,
} from './rate-limit';
import type { AuthRealm } from './realm';
import {
    generateAuthRecoveryCodes,
    hashAuthRecoveryCode,
} from './recovery-code';
import {
    decryptAuthSecret,
    encryptAuthSecret,
} from './secret-encryption';
import { revokeAllAuthSessions } from './session';
import {
    generateAuthTotpSecret,
    toAuthTotpUri,
    verifyAuthTotpCode,
} from './totp';

interface TotpSetupChallenge {
    principalId: string;

    /**
     * 已加密的待確認密鑰。
     */
    secret: string;
}

// Functions

/**
 * 確認 TOTP 綁定：輸入一次驗證碼後才寫入帳號設定，並記錄該時間步。第一次綁定第二因子時回傳新產生的救援碼。
 */
export async function confirmAuthTotpSetup(
    realm: AuthRealm<any>,
    principalId: string,
    challengeId: string,
    code: string,
    context: AuthOperationContext,
    restrictedSession: boolean,
) {
    const challenge = await getAuthChallenge<TotpSetupChallenge>(realm.name, 'totpSetup', challengeId);
    if (!challenge || challenge.principalId !== principalId) throw new AuthError('challengeExpired');
    await consumeAuthPrincipalAttempt(realm, 'totpSetupByPrincipal', principalId, 'totp', context.request);
    const secretContext = toAuthTotpSecretContext(realm, principalId);
    const secret = decryptAuthSecret(challenge.secret, secretContext);
    const step = secret && verifyAuthTotpCode(secret.value, code);
    if (!secret || step === undefined) throw new AuthError('invalidVerificationCode');
    await clearAuthAttempts(realm.name, 'totpSetupByPrincipal', principalId);
    if (!await deleteAuthChallenge(realm.name, 'totpSetup', challengeId)) throw new AuthError('challengeExpired');
    const { twoFactorRequired } = await realm.getConfig();
    const recoveryCodes = await mutateAuthPrincipalSetting(
        realm,
        principalId,
        (setting) => {
            if (setting.totp) throw new AuthError('totpAlreadyConfigured');
            return toSecondFactorAdditionMutation(
                realm,
                setting,
                {
                    $set: {
                        totp: {
                            confirmedAt: new EnhancedDate(),
                            lastUsedStep: step,
                            secret: encryptAuthSecret(secret.value, secretContext),
                        },
                    },
                },
                twoFactorRequired,
                restrictedSession,
            );
        },
    );

    await recordAuthEvent(
        realm,
        {
            ...context,
            principalId,
            type: AuthEventType.TotpAdded,
        },
    );

    return { recoveryCodes };
}

export async function getAuthSecurityOverview(
    realm: AuthRealm<any>,
    principalId: string,
): Promise<AuthSecurityOverviewData> {
    const [config, setting] = await Promise.all([
        realm.getConfig(),
        findAuthPrincipalSetting(realm, principalId),
    ]);

    return {
        passkeys: (setting?.passkeys ?? []).map((passkey) => ({
            createdAt: passkey.createdAt.toISOString(),
            deviceType: passkey.deviceType,
            id: passkey.credentialId,
            lastUsedAt: passkey.lastUsedAt?.toISOString(),
            name: passkey.name,
        })),
        passkeySupported: !!realm.webauthn,
        qrCodeLoginEnabled: config.qrCodeLoginEnabled,
        recoveryCodesRemaining: setting?.recoveryCodes.filter((recoveryCode) => !recoveryCode.usedAt).length ?? 0,
        totpConfirmedAt: setting?.totp?.confirmedAt.toISOString(),
        twoFactor: {
            enabled: !!setting?.twoFactorEnabled,
            enforced: !!setting?.twoFactorEnforced,
            required: config.twoFactorRequired,
        },
    };
}

/**
 * 重新產生救援碼，舊的全部作廢；回傳明文（只顯示一次）。
 */
export async function regenerateAuthRecoveryCodes(
    realm: AuthRealm<any>,
    principalId: string,
    context: AuthOperationContext,
) {
    const recoveryCodes = await mutateAuthPrincipalSetting(
        realm,
        principalId,
        (setting) => {
            if (!hasAuthSecondFactor(realm, setting)) throw new AuthError('secondFactorNotConfigured');
            const recoveryCodes = generateAuthRecoveryCodes();
            return {
                result: recoveryCodes,
                update: { $set: { recoveryCodes: toStoredRecoveryCodes(recoveryCodes) } },
            };
        },
    );

    await recordAuthEvent(
        realm,
        {
            ...context,
            principalId,
            type: AuthEventType.RecoveryCodesRegenerated,
        },
    );

    return recoveryCodes;
}

/**
 * 綁定 passkey。第一次綁定第二因子時回傳新產生的救援碼。
 */
export async function registerAuthPasskey(
    realm: AuthRealm<any>,
    principalId: string,
    challengeId: string,
    response: RegistrationResponseJSON,
    name: string,
    context: AuthOperationContext,
    restrictedSession: boolean,
) {
    const passkey = await verifyAuthPasskeyRegistration(realm, principalId, challengeId, response, name);
    const { twoFactorRequired } = await realm.getConfig();
    const recoveryCodes = await mutateAuthPrincipalSetting(
        realm,
        principalId,
        (setting) => {
            if (setting.passkeys.length >= maxAuthPasskeysPerPrincipal) throw new AuthError('passkeyLimitReached');
            if (setting.passkeys.some(({ credentialId }) => credentialId === passkey.credentialId)) {
                throw new AuthError('passkeyVerificationFailed');
            }

            return toSecondFactorAdditionMutation(
                realm,
                setting,
                { $push: { passkeys: passkey } },
                twoFactorRequired,
                restrictedSession,
            );
        },
    );

    await recordAuthEvent(
        realm,
        {
            ...context,
            metadata: { name: passkey.name },
            principalId,
            type: AuthEventType.PasskeyAdded,
        },
    );

    return { recoveryCodes };
}

export async function removeAuthPasskey(
    realm: AuthRealm<any>,
    principalId: string,
    credentialId: string,
    context: AuthOperationContext,
) {
    const passkey = await removeSecondFactor(
        realm,
        principalId,
        (setting) => setting.passkeys.find((passkey) => passkey.credentialId === credentialId),
        (setting) => ({
            ...setting,
            passkeys: setting.passkeys.filter((passkey) => passkey.credentialId !== credentialId),
        }),
        { $pull: { passkeys: { credentialId } } },
    );

    if (!passkey) return false;
    await recordAuthEvent(
        realm,
        {
            ...context,
            metadata: { name: passkey.name },
            principalId,
            type: AuthEventType.PasskeyRemoved,
        },
    );

    return true;
}

export async function removeAuthTotp(realm: AuthRealm<any>, principalId: string, context: AuthOperationContext) {
    const totp = await removeSecondFactor(
        realm,
        principalId,
        (setting) => setting.totp,
        (setting) => ({
            ...setting,
            totp: undefined,
        }),
        { $unset: { totp: 1 } },
    );

    if (!totp) return false;
    await recordAuthEvent(
        realm,
        {
            ...context,
            principalId,
            type: AuthEventType.TotpRemoved,
        },
    );

    return true;
}

/**
 * 移除第二因子，回傳被移除的因子；不存在時回傳 undefined。仍被強制使用雙重驗證的帳號不可移除最後一個第二因子；
 * 其餘帳號移除最後一個時，自動關閉雙重驗證並作廢救援碼。
 */
async function removeSecondFactor<Factor>(
    realm: AuthRealm<any>,
    principalId: string,
    findFactor: (setting: AuthPrincipalSetting) => Factor | undefined,
    toSettingAfterRemoval: (setting: AuthPrincipalSetting) => AuthPrincipalSetting,
    update: UpdateQuery<AuthPrincipalSetting>,
) {
    const { twoFactorRequired } = await realm.getConfig();
    return await mutateAuthPrincipalSetting(
        realm,
        principalId,
        (setting) => {
            const factor = findFactor(setting);
            if (!factor) return { result: undefined };
            const removesLastSecondFactor = !hasAuthSecondFactor(realm, toSettingAfterRemoval(setting));
            if (removesLastSecondFactor && (twoFactorRequired || setting.twoFactorEnforced)) {
                throw new AuthError('twoFactorEnforced');
            }

            return {
                result: factor,
                update: {
                    ...update,
                    ...removesLastSecondFactor && {
                        $set: {
                            recoveryCodes: [],
                            twoFactorEnabled: false,
                        },
                    },
                },
            };
        },
    );
}

/**
 * 重新命名 passkey。名稱不影響「有哪些因子」的判斷，所以直接原子更新，不經過 `mutateAuthPrincipalSetting`。
 */
export async function renameAuthPasskey(
    realm: AuthRealm<any>,
    principalId: string,
    credentialId: string,
    name: string,
) {
    const updateResult = await AuthPrincipalSettingModel.updateOne(
        {
            'passkeys.credentialId': credentialId,
            principalId,
            'realm': realm.name,
        },
        { $set: { 'passkeys.$.name': name } },
    );

    return updateResult.matchedCount === 1;
}

/**
 * 重設帳號的雙重驗證：清除 TOTP、passkey、救援碼並踢除全部工作階段，用於裝置遺失。
 * 帳號仍屬強制範圍時，下次登入會進入受限工作階段重新綁定。
 */
export async function resetAuthTwoFactor(realm: AuthRealm<any>, principalId: string, context: AuthOperationContext) {
    await mutateAuthPrincipalSetting(
        realm,
        principalId,
        () => ({
            result: undefined,
            update: {
                $set: {
                    passkeys: [],
                    recoveryCodes: [],
                    twoFactorEnabled: false,
                },
                $unset: { totp: 1 },
            },
        }),
    );

    await revokeAllAuthSessions(realm, principalId);
    await recordAuthEvent(
        realm,
        {
            ...context,
            principalId,
            type: AuthEventType.TwoFactorReset,
        },
    );
}

/**
 * 本人開啟或關閉雙重驗證。開啟需已綁定至少一個第二因子；被強制的帳號不可關閉。
 */
export async function setAuthTwoFactorEnabled(
    realm: AuthRealm<any>,
    principalId: string,
    enabled: boolean,
    context: AuthOperationContext,
) {
    const { twoFactorRequired } = await realm.getConfig();
    const changed = await mutateAuthPrincipalSetting(
        realm,
        principalId,
        (setting) => {
            if (enabled && !hasAuthSecondFactor(realm, setting)) throw new AuthError('secondFactorNotConfigured');
            if (!enabled && (twoFactorRequired || setting.twoFactorEnforced)) throw new AuthError('twoFactorEnforced');
            if (setting.twoFactorEnabled === enabled) return { result: false };
            return {
                result: true,
                update: { $set: { twoFactorEnabled: enabled } },
            };
        },
    );

    if (!changed) return;
    await recordAuthEvent(
        realm,
        {
            ...context,
            principalId,
            type: enabled ? AuthEventType.TwoFactorEnabled : AuthEventType.TwoFactorDisabled,
        },
    );
}

/**
 * 由有管理權限者設定或取消「此帳號強制使用雙重驗證」。取消時已綁定的因子保留，由本人決定是否關閉。
 */
export async function setAuthTwoFactorEnforced(
    realm: AuthRealm<any>,
    principalId: string,
    enforced: boolean,
    context: AuthOperationContext,
) {
    const changed = await mutateAuthPrincipalSetting(
        realm,
        principalId,
        (setting) => {
            if (setting.twoFactorEnforced === enforced) return { result: false };
            return {
                result: true,
                update: {
                    $set: {
                        // 強制期間綁定的因子在取消強制後仍保留並維持啟用，由本人決定是否關閉。
                        ...!enforced && hasAuthSecondFactor(realm, setting) && { twoFactorEnabled: true },
                        twoFactorEnforced: enforced,
                    },
                },
            };
        },
    );

    if (!changed) return;
    await recordAuthEvent(
        realm,
        {
            ...context,
            metadata: { enforced },
            principalId,
            type: AuthEventType.TwoFactorEnforcementChanged,
        },
    );
}

/**
 * 開始綁定 TOTP：產生密鑰與 `otpauth://` URI，密鑰暫存在挑戰中，確認後才寫入帳號設定。
 */
export async function startAuthTotpSetup<P extends AuthPrincipal>(realm: AuthRealm<P>, principal: P) {
    const principalId = principal._id.toString();
    if ((await findAuthPrincipalSetting(realm, principalId))?.totp) throw new AuthError('totpAlreadyConfigured');
    const secret = generateAuthTotpSecret();
    return {
        challengeId: await createAuthChallenge(
            realm.name,
            'totpSetup',
            {
                principalId,
                secret: encryptAuthSecret(secret, toAuthTotpSecretContext(realm, principalId)),
            } satisfies TotpSetupChallenge,
        ),
        secret,
        uri: toAuthTotpUri(secret, realm.displayName, realm.getPrincipalDisplayName(principal)),
    };
}

/**
 * 綁定第二因子的更新。帳號還沒有救援碼時（第一次綁定第二因子）一併產生，明文作為結果回傳（只顯示一次）；
 * 已有救援碼時結果為 undefined。
 *
 * 帳號被強制使用雙重驗證（平台或個別帳號）時一併開啟本人的開關，之後取消強制仍維持雙重驗證，由本人決定是否關閉。
 *
 * 受限工作階段只能綁定帳號的第一個第二因子：免高危驗證的前提是「帳號還沒有任何第二因子」，
 * 一旦已綁定（例如本人在另一個受限工作階段完成設定），其餘受限工作階段即不可再綁定，拋出 `sessionInvalid`。
 * 這個判斷與寫入經過 `mutateAuthPrincipalSetting`，並行綁定也只有一個能成功。
 */
function toSecondFactorAdditionMutation(
    realm: AuthRealm<any>,
    setting: AuthPrincipalSetting,
    update: UpdateQuery<AuthPrincipalSetting>,
    twoFactorRequired: boolean,
    restrictedSession: boolean,
) {
    if (restrictedSession && hasAuthSecondFactor(realm, setting)) throw new AuthError('sessionInvalid');
    const recoveryCodes = setting.recoveryCodes.length ? undefined : generateAuthRecoveryCodes();
    const enablesTwoFactor = !setting.twoFactorEnabled && (twoFactorRequired || setting.twoFactorEnforced);
    return {
        result: recoveryCodes,
        update: recoveryCodes || enablesTwoFactor
            ? {
                ...update,
                $set: {
                    ...update.$set,
                    ...recoveryCodes && { recoveryCodes: toStoredRecoveryCodes(recoveryCodes) },
                    ...enablesTwoFactor && { twoFactorEnabled: true },
                },
            }
            : update,
    };
}

function toStoredRecoveryCodes(recoveryCodes: string[]) {
    return recoveryCodes.map((code) => ({ hash: hashAuthRecoveryCode(code) }));
}
