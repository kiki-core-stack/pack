import type { AuthVerificationRequiredErrorData } from '../../types/api';

export type AuthErrorCode =
  | 'challengeExpired'
  | 'forbidden'
  | 'incorrectPassword'
  | 'invalidCredentials'
  | 'invalidVerificationCode'
  | 'originNotAllowed'
  | 'passkeyLimitReached'
  | 'passkeyUnsupported'
  | 'passkeyVerificationFailed'
  | 'qrCodeLoginDisabled'
  | 'qrCodeLoginExpired'
  | 'secondFactorNotConfigured'
  | 'secondFactorSetupRequired'
  | 'sessionInvalid'
  | 'tooManyAttempts'
  | 'totpAlreadyConfigured'
  | 'twoFactorEnforced'
  | 'unauthorized'
  | 'verificationCodeUnavailable'
  | 'verificationRequired';

interface AuthErrorOptions extends ErrorOptions {
    /**
     * 隨錯誤回傳給用戶端的資料。
     */
    data?: AuthVerificationRequiredErrorData;
}

// Classes

/**
 * auth 流程的可預期失敗。HTTP 回應由 `hono-backend` 的錯誤處理依 `code` 對應到 API 錯誤。
 */
export class AuthError extends Error {
    readonly code: AuthErrorCode;
    readonly data?: AuthVerificationRequiredErrorData;

    constructor(code: 'verificationRequired', options: AuthErrorOptions & { data: AuthVerificationRequiredErrorData });
    constructor(code: Exclude<AuthErrorCode, 'verificationRequired'>, options?: ErrorOptions);
    constructor(code: AuthErrorCode, options?: AuthErrorOptions) {
        super(code, options);
        this.code = code;
        this.data = options?.data;
        this.name = 'AuthError';
    }
}
