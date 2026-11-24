import { Buffer } from 'node:buffer';

import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
    AuthenticationResponseJSON,
    AuthenticatorTransport,
    RegistrationResponseJSON,
} from '@simplewebauthn/server';

import { AuthPrincipalSettingModel } from '../../../models/auth/principal-setting';
import type {
    AuthPrincipalSetting,
    AuthPrincipalSettingPasskey,
} from '../../../models/auth/principal-setting';
import type { AuthPrincipal } from '../../../types/auth';
import {
    consumeAuthChallenge,
    createAuthChallenge,
} from '../challenge';
import { AuthError } from '../error';
import { getOrCreateAuthPrincipalSetting } from '../principal-setting';
import type { AuthRealm } from '../realm';

/**
 * WebAuthn 挑戰的用途；驗證時必須與目前的操作相符。
 */
export type AuthPasskeyChallengePurpose = 'login' | 'registration' | 'secondFactor' | 'verification';

interface AuthPasskeyChallenge {
    challenge: string;

    /**
     * 挑戰綁定的帳號；未登入的 passkey 登入沒有綁定帳號。
     */
    principalId?: string;
    purpose: AuthPasskeyChallengePurpose;

    /**
     * 開始綁定的工作階段，只有它能完成綁定；只用於 `registration`。
     */
    sessionId?: string;
}

// Constants
export const maxAuthPasskeysPerPrincipal = 10;

// Functions

/**
 * 產生 passkey 驗證的選項。登入時不綁定帳號，由用戶端選擇 discoverable credential；
 * 其餘用途綁定帳號，只允許該帳號已綁定的憑證。
 */
export async function createAuthPasskeyAuthenticationOptions(
    realm: AuthRealm<any>,
    purpose: Exclude<AuthPasskeyChallengePurpose, 'registration'>,
    setting?: AuthPrincipalSetting,
) {
    const webauthn = getRealmWebauthn(realm);
    if (purpose !== 'login' && !setting?.passkeys.length) throw new AuthError('passkeyVerificationFailed');
    const options = await generateAuthenticationOptions({
        allowCredentials: purpose === 'login'
            ? []
            : setting!.passkeys.map((passkey) => ({
                id: passkey.credentialId,
                transports: passkey.transports as AuthenticatorTransport[],
            })),
        rpID: webauthn.rpId,
        userVerification: 'required',
    });

    return {
        challengeId: await createAuthChallenge(
            realm.name,
            'webauthn',
            {
                challenge: options.challenge,
                principalId: setting?.principalId.toString(),
                purpose,
            } satisfies AuthPasskeyChallenge,
        ),
        options,
    };
}

export async function createAuthPasskeyRegistrationOptions<P extends AuthPrincipal>(
    realm: AuthRealm<P>,
    principal: P,
    sessionId: string,
) {
    const webauthn = getRealmWebauthn(realm);
    const setting = await getOrCreateAuthPrincipalSetting(realm, principal._id);
    if (setting.passkeys.length >= maxAuthPasskeysPerPrincipal) throw new AuthError('passkeyLimitReached');
    const displayName = realm.getPrincipalDisplayName(principal);
    const options = await generateRegistrationOptions({
        attestationType: 'none',
        authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'required',
        },
        excludeCredentials: setting.passkeys.map((passkey) => ({
            id: passkey.credentialId,
            transports: passkey.transports as AuthenticatorTransport[],
        })),
        rpID: webauthn.rpId,
        rpName: realm.displayName,
        userDisplayName: displayName,
        userID: Buffer.from(setting.webauthnUserHandle, 'base64url'),
        userName: displayName,
    });

    return {
        challengeId: await createAuthChallenge(
            realm.name,
            'webauthn',
            {
                challenge: options.challenge,
                principalId: principal._id.toString(),
                purpose: 'registration',
                sessionId,
            } satisfies AuthPasskeyChallenge,
        ),
        options,
    };
}

/**
 * 以用戶端回傳的 user handle 找出帳號設定。回傳值尚未經過驗證，只用於在驗證前取得帳號（例如讀取世代計數）。
 */
export async function findAuthPrincipalSettingByPasskeyResponse(
    realm: AuthRealm<any>,
    response: AuthenticationResponseJSON,
) {
    const userHandle = response.response.userHandle;
    if (!userHandle) return;
    return await AuthPrincipalSettingModel
        .findOne({
            realm: realm.name,
            webauthnUserHandle: userHandle,
        })
        .lean<AuthPrincipalSetting>() ?? undefined;
}

function getRealmWebauthn(realm: AuthRealm<any>) {
    if (!realm.webauthn) throw new AuthError('passkeyUnsupported');
    return realm.webauthn;
}

/**
 * 驗證 passkey 並回傳所使用的憑證。挑戰讀取即刪除，失敗也不可重用。
 */
export async function verifyAuthPasskeyAuthentication(
    realm: AuthRealm<any>,
    purpose: Exclude<AuthPasskeyChallengePurpose, 'registration'>,
    setting: AuthPrincipalSetting,
    challengeId: string,
    response: AuthenticationResponseJSON,
) {
    const webauthn = getRealmWebauthn(realm);
    const challenge = await consumeAuthChallenge<AuthPasskeyChallenge>(realm.name, 'webauthn', challengeId);
    if (!challenge) throw new AuthError('challengeExpired');
    if (
        challenge.purpose !== purpose
        || (purpose === 'login' ? challenge.principalId !== undefined : challenge.principalId !== setting.principalId.toString())
        || (response.response.userHandle !== undefined && response.response.userHandle !== setting.webauthnUserHandle)
    ) throw new AuthError('passkeyVerificationFailed');

    const passkey = setting.passkeys.find((passkey) => passkey.credentialId === response.id);
    // 與其他失敗分開回報：前端據此通知密碼管理工具移除這把已不存在的密碼金鑰。
    if (!passkey) throw new AuthError('passkeyUnknown');

    let newCounter: number;
    try {
        const verification = await verifyAuthenticationResponse({
            credential: {
                counter: passkey.counter,
                id: passkey.credentialId,
                publicKey: Buffer.from(passkey.publicKey, 'base64url'),
                transports: passkey.transports,
            },
            expectedChallenge: challenge.challenge,
            expectedOrigin: realm.origin,
            expectedRPID: webauthn.rpId,
            requireUserVerification: true,
            response,
        });

        if (!verification.verified) throw new AuthError('passkeyVerificationFailed');
        newCounter = verification.authenticationInfo.newCounter;
    } catch (error) {
        throw new AuthError('passkeyVerificationFailed', { cause: error });
    }

    // 新舊計數器皆為 0 時不檢查（同步型 passkey 恆為 0）；任一非 0 時套件已確認新值大於舊值。
    // 以舊值作為更新條件，並行送出的同一個憑證只有一個能通過。
    const updateResult = await AuthPrincipalSettingModel.updateOne(
        {
            _id: setting._id,
            passkeys: {
                $elemMatch: {
                    counter: passkey.counter,
                    credentialId: passkey.credentialId,
                },
            },
        },
        {
            $set: {
                'passkeys.$.counter': newCounter,
                'passkeys.$.lastUsedAt': new EnhancedDate(),
            },
        },
    );

    if (updateResult.matchedCount !== 1) throw new AuthError('passkeyVerificationFailed');
    return passkey;
}

/**
 * 驗證 passkey 的註冊並回傳要綁定的 passkey；寫入帳號設定由呼叫端負責。
 */
export async function verifyAuthPasskeyRegistration(
    realm: AuthRealm<any>,
    principalId: string,
    sessionId: string,
    challengeId: string,
    response: RegistrationResponseJSON,
    name: string,
) {
    const webauthn = getRealmWebauthn(realm);
    const challenge = await consumeAuthChallenge<AuthPasskeyChallenge>(realm.name, 'webauthn', challengeId);
    if (!challenge) throw new AuthError('challengeExpired');
    if (
        challenge.purpose !== 'registration'
        || challenge.principalId !== principalId
        || challenge.sessionId !== sessionId
    ) throw new AuthError('passkeyVerificationFailed');

    let passkey: AuthPrincipalSettingPasskey;
    try {
        const verification = await verifyRegistrationResponse({
            expectedChallenge: challenge.challenge,
            expectedOrigin: realm.origin,
            expectedRPID: webauthn.rpId,
            requireUserVerification: true,
            response,
        });

        if (!verification.verified || !verification.registrationInfo) throw new AuthError('passkeyVerificationFailed');
        const {
            aaguid,
            credential,
            credentialDeviceType,
        } = verification.registrationInfo;

        passkey = {
            aaguid,
            counter: credential.counter,
            createdAt: new EnhancedDate(),
            credentialId: credential.id,
            deviceType: credentialDeviceType,
            name,
            publicKey: Buffer.from(credential.publicKey).toString('base64url'),
            transports: credential.transports ?? [],
        };
    } catch (error) {
        throw new AuthError('passkeyVerificationFailed', { cause: error });
    }

    return passkey;
}
