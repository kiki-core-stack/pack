import type { ReadonlyRecord } from '@kikiutils/shared/types';
import type { ArrayValues } from 'type-fest';

import type { LocalizedMessages } from '../types/i18n';

export enum AuthEventType {
    AllSessionsRevoked = 0,
    LoginFailure = 1,
    LoginSuccess = 2,
    Logout = 3,
    OtherSessionsRevoked = 19,
    PasskeyAdded = 4,
    PasskeyRemoved = 5,
    PasswordChanged = 6,
    PasswordReset = 20,
    QrCodeLoginApproved = 7,
    QrCodeLoginRejected = 8,
    RateLimited = 9,
    RecoveryCodesRegenerated = 10,
    SessionRevoked = 11,
    TotpAdded = 12,
    TotpRemoved = 13,
    TwoFactorDisabled = 14,
    TwoFactorEnabled = 15,
    TwoFactorEnforcementChanged = 16,
    TwoFactorReset = 17,
    VerificationFailure = 18,
}

/**
 * 攜帶高危操作驗證一次性憑據的請求標頭。
 */
export const authVerificationHeaderName = 'x-auth-verification';

/**
 * 登入或高危操作驗證所使用的因子。`code` 是 realm 寄出的一次性驗證碼，`external` 是由外部驗證的身分（例如 OAuth）。
 */
export const authFactors = [
    'code',
    'external',
    'passkey',
    'password',
    'recoveryCode',
    'totp',
] as const;

/**
 * 可作為第二因子的因子。
 */
export const authSecondFactors = [
    'passkey',
    'recoveryCode',
    'totp',
] as const;

/**
 * 內建需要高危操作驗證的操作名稱；用戶端以此取得一次性憑據。
 */
export const authVerificationOperations = {
    addFactor: 'auth.addFactor',
    approveQrCodeLogin: 'auth.approveQrCodeLogin',
    changePassword: 'auth.changePassword',
    disableTwoFactor: 'auth.disableTwoFactor',
    manageTwoFactor: 'auth.manageTwoFactor',
    regenerateRecoveryCodes: 'auth.regenerateRecoveryCodes',
    removeFactor: 'auth.removeFactor',
} as const;

export const authEventTypeToLabelMap: ReadonlyRecord<AuthEventType, LocalizedMessages> = {
    [AuthEventType.AllSessionsRevoked]: {
        'en': 'All sessions revoked',
        'zh-TW': '登出所有裝置',
    },
    [AuthEventType.LoginFailure]: {
        'en': 'Login failed',
        'zh-TW': '登入失敗',
    },
    [AuthEventType.LoginSuccess]: {
        'en': 'Login succeeded',
        'zh-TW': '登入成功',
    },
    [AuthEventType.Logout]: {
        'en': 'Logged out',
        'zh-TW': '登出',
    },
    [AuthEventType.OtherSessionsRevoked]: {
        'en': 'Other sessions revoked',
        'zh-TW': '登出其他裝置',
    },
    [AuthEventType.PasskeyAdded]: {
        'en': 'Passkey added',
        'zh-TW': '新增密碼金鑰',
    },
    [AuthEventType.PasskeyRemoved]: {
        'en': 'Passkey removed',
        'zh-TW': '移除密碼金鑰',
    },
    [AuthEventType.PasswordChanged]: {
        'en': 'Password changed',
        'zh-TW': '變更密碼',
    },
    [AuthEventType.PasswordReset]: {
        'en': 'Password reset',
        'zh-TW': '重設密碼',
    },
    [AuthEventType.QrCodeLoginApproved]: {
        'en': 'QR code login approved',
        'zh-TW': '核准 QR Code 登入',
    },
    [AuthEventType.QrCodeLoginRejected]: {
        'en': 'QR code login rejected',
        'zh-TW': '拒絕 QR Code 登入',
    },
    [AuthEventType.RateLimited]: {
        'en': 'Too many attempts',
        'zh-TW': '嘗試次數過多',
    },
    [AuthEventType.RecoveryCodesRegenerated]: {
        'en': 'Recovery codes regenerated',
        'zh-TW': '重新產生救援碼',
    },
    [AuthEventType.SessionRevoked]: {
        'en': 'Session revoked',
        'zh-TW': '登出裝置',
    },
    [AuthEventType.TotpAdded]: {
        'en': 'Authenticator app added',
        'zh-TW': '綁定驗證器',
    },
    [AuthEventType.TotpRemoved]: {
        'en': 'Authenticator app removed',
        'zh-TW': '移除驗證器',
    },
    [AuthEventType.TwoFactorDisabled]: {
        'en': 'Two-factor authentication disabled',
        'zh-TW': '關閉雙重驗證',
    },
    [AuthEventType.TwoFactorEnabled]: {
        'en': 'Two-factor authentication enabled',
        'zh-TW': '開啟雙重驗證',
    },
    [AuthEventType.TwoFactorEnforcementChanged]: {
        'en': 'Two-factor enforcement changed',
        'zh-TW': '變更強制雙重驗證',
    },
    [AuthEventType.TwoFactorReset]: {
        'en': 'Two-factor authentication reset',
        'zh-TW': '重設雙重驗證',
    },
    [AuthEventType.VerificationFailure]: {
        'en': 'Verification failed',
        'zh-TW': '驗證失敗',
    },
};

export const authFactorToLabelMap: ReadonlyRecord<ArrayValues<typeof authFactors>, LocalizedMessages> = {
    code: {
        'en': 'Verification code',
        'zh-TW': '驗證碼',
    },
    external: {
        'en': 'External account',
        'zh-TW': '外部帳號',
    },
    passkey: {
        'en': 'Passkey',
        'zh-TW': '密碼金鑰',
    },
    password: {
        'en': 'Password',
        'zh-TW': '密碼',
    },
    recoveryCode: {
        'en': 'Recovery code',
        'zh-TW': '救援碼',
    },
    totp: {
        'en': 'Authenticator app',
        'zh-TW': '驗證器',
    },
};
