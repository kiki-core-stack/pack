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
