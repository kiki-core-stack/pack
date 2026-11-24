import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';
import type { UnknownRecord } from 'type-fest';

import type { AuthEventType } from '../../constants/auth';
import type {
    AuthFactor,
    AuthSecondFactor,
} from '../auth';

export type AuthLoginResultData =
  | {
      /**
       * 受限工作階段只能綁定第二因子，綁定完成後才換發正常工作階段。
       */
      restricted: boolean;
      state: 'completed';
  }
  | {
      challengeId: string;
      factors: AuthSecondFactor[];
      state: 'secondFactorRequired';
  };

export interface AuthChangePasswordData {
    /**
     * 需要目前密碼時才填（見安全性總覽的 `passwordChangeRequiresCurrentPassword`）。
     */
    currentPassword?: string;
    newPassword: string;
}

export interface AuthEventData extends BaseMongooseModelData<true, false> {
    actorPrincipalId: string;
    actorRealm: string;
    factor?: AuthFactor;
    ip?: string;
    metadata?: UnknownRecord;
    principalId: string;
    realm: string;
    sessionId?: string;
    type: AuthEventType;
    userAgent?: string;
}

export interface AuthPasskeyData {
    createdAt: string;
    deviceType: 'multiDevice' | 'singleDevice';
    id: string;
    lastUsedAt?: string;
    name: string;
}

export interface AuthPasswordLoginData {
    account: string;
    password: string;
}

export interface AuthQrCodeLoginCreationData {
    expiresInSeconds: number;

    /**
     * 只留在建立請求的裝置，用來輪詢結果。
     */
    pollSecret: string;

    /**
     * 放進 QR Code 的網址，供已登入裝置核准。
     */
    qrToken: string;
}

/**
 * 已登入裝置掃描後看到的請求方資訊。
 */
export interface AuthQrCodeLoginInfoData {
    createdAt: string;
    ip?: string;

    /**
     * 核准前是否需要高危操作驗證。
     */
    requiresVerification: boolean;
    userAgent?: string;
}

/**
 * 第一次綁定第二因子時才有救援碼，明文只回傳這一次。
 */
export interface AuthRecoveryCodesData {
    recoveryCodes?: string[];
}

export interface AuthSecurityOverviewData {
    /**
     * 帳號是否已設定密碼；以外部身分註冊的帳號可能沒有。
     */
    hasPassword: boolean;
    passkeys: AuthPasskeyData[];

    /**
     * 變更密碼是否要輸入目前密碼；否則只需高危操作驗證。
     */
    passwordChangeRequiresCurrentPassword: boolean;
    qrCodeLoginEnabled: boolean;
    recoveryCodesRemaining: number;
    totpConfirmedAt?: string;
    twoFactor: {
        /**
         * 本人是否開啟。
         */
        enabled: boolean;

        /**
         * 此帳號是否被有管理權限者強制。
         */
        enforced: boolean;

        /**
         * 平台設定是否強制所有帳號。
         */
        required: boolean;
    };

    /**
     * realm 支援密碼金鑰時才有。
     */
    webauthn?: {
        rpId: string;

        /**
         * 只在本人的總覽且帳號設定已建立時回傳，供前端以 WebAuthn Signal API 通知密碼管理工具哪些密碼金鑰仍有效。
         */
        userHandle?: string;
    };
}

export interface AuthSentCodeData {
    /**
     * 遮罩後的收件位址，realm 有提供時才有。
     */
    destinationHint?: string;
}

export interface AuthSessionData {
    approvedBySessionId?: string;
    createdAt: string;
    current: boolean;
    factors: AuthFactor[];
    id: string;
    ip?: string;
    lastActiveAt: string;
    userAgent?: string;
}

export interface AuthTotpSetupData {
    challengeId: string;
    secret: string;

    /**
     * `otpauth://` 網址，供驗證器掃描。
     */
    uri: string;
}
