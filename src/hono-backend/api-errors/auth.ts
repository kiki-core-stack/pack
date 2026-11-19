import { authVerificationRequiredErrorDataSchema } from '../../schemas/api';
import { defineApiErrors } from '../libs/api/error';

export const {
    challengeExpired,
    incorrectPassword,
    invalidCredentials,
    invalidVerificationCode,
    originNotAllowed,
    passkeyLimitReached,
    passkeyUnknown,
    passkeyUnsupported,
    passkeyVerificationFailed,
    qrCodeLoginDisabled,
    qrCodeLoginExpired,
    secondFactorNotConfigured,
    secondFactorSetupRequired,
    sessionInvalid,
    tooManyAttempts,
    totpAlreadyConfigured,
    twoFactorEnforced,
    verificationCodeUnavailable,
    verificationRequired,
} = defineApiErrors({
    challengeExpired: {
        message: {
            'en': 'The verification has expired; please start over',
            'zh-TW': '驗證已逾時，請重新操作',
        },
        status: 410,
    },
    incorrectPassword: {
        message: {
            'en': 'Incorrect password',
            'zh-TW': '密碼錯誤',
        },
        status: 400,
    },

    /**
     * Account not found, wrong password or disabled account alike, so responses never reveal whether an account exists.
     */
    invalidCredentials: {
        message: {
            'en': 'Incorrect account or password',
            'zh-TW': '帳號或密碼錯誤',
        },
        status: 401,
    },
    invalidVerificationCode: {
        message: {
            'en': 'Incorrect verification code',
            'zh-TW': '驗證碼錯誤',
        },
        status: 400,
    },
    originNotAllowed: {
        message: {
            'en': 'Request origin not allowed',
            'zh-TW': '不允許的請求來源',
        },
        status: 403,
    },
    passkeyLimitReached: {
        message: {
            'en': 'The passkey limit has been reached',
            'zh-TW': '密碼金鑰數量已達上限',
        },
        status: 409,
    },
    passkeyUnknown: {
        message: {
            'en': 'This passkey is no longer valid',
            'zh-TW': '此密碼金鑰已失效',
        },
        status: 400,
    },
    passkeyUnsupported: {
        message: {
            'en': 'Passkeys are not available',
            'zh-TW': '不支援密碼金鑰',
        },
        status: 400,
    },
    passkeyVerificationFailed: {
        message: {
            'en': 'Passkey verification failed',
            'zh-TW': '密碼金鑰驗證失敗',
        },
        status: 400,
    },
    qrCodeLoginDisabled: {
        message: {
            'en': 'QR code login is not available',
            'zh-TW': '未開放 QR Code 登入',
        },
        status: 403,
    },
    qrCodeLoginExpired: {
        message: {
            'en': 'The QR code has expired',
            'zh-TW': 'QR Code 已失效',
        },
        status: 410,
    },
    secondFactorNotConfigured: {
        message: {
            'en': 'Set up a passkey or an authenticator app first',
            'zh-TW': '請先綁定密碼金鑰或驗證器',
        },
        status: 409,
    },

    /**
     * The session is restricted: two-factor authentication is required but no second factor is set up yet.
     */
    secondFactorSetupRequired: {
        message: {
            'en': 'Set up two-factor authentication to continue',
            'zh-TW': '請先完成雙重驗證設定',
        },
        status: 403,
    },
    sessionInvalid: {
        message: {
            'en': 'Session expired; please log in again',
            'zh-TW': '登入已失效，請重新登入',
        },
        status: 401,
    },
    tooManyAttempts: {
        message: {
            'en': 'Too many attempts; please try again later',
            'zh-TW': '嘗試次數過多，請稍後再試',
        },
        status: 429,
    },
    totpAlreadyConfigured: {
        message: {
            'en': 'An authenticator app is already set up',
            'zh-TW': '已綁定驗證器',
        },
        status: 409,
    },
    twoFactorEnforced: {
        message: {
            'en': 'Two-factor authentication is required for this account',
            'zh-TW': '此帳號必須使用雙重驗證',
        },
        status: 409,
    },

    /**
     * The realm has no messenger, or the account cannot use a verification code: it has a second factor or no
     * destination.
     */
    verificationCodeUnavailable: {
        message: {
            'en': 'Verification codes are not available',
            'zh-TW': '無法使用驗證碼',
        },
        status: 400,
    },

    /**
     * The operation needs a one-time verification grant in the `X-Auth-Verification` header; `errorData` tells the
     * operation to verify for and the factors the account can verify with.
     */
    verificationRequired: {
        errorData: authVerificationRequiredErrorDataSchema,
        message: {
            'en': 'Verify your identity to continue',
            'zh-TW': '請先驗證身分',
        },
        status: 403,
    },
});
