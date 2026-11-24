import type { Types } from 'mongoose';
import type {
    ArrayValues,
    UnknownRecord,
} from 'type-fest';

import type {
    AuthEventType,
    authFactors,
    authSecondFactors,
} from '../constants/auth';

export type AuthFactor = ArrayValues<typeof authFactors>;

/**
 * 交給 realm 寄給帳號的訊息：
 *
 * - `verification`：高危操作驗證用的六位數驗證碼，由使用者輸入。
 * - `passwordReset`：未登入的重設密碼用的 token，放進前端重設密碼頁的連結（建議放在 fragment）。
 */
export type AuthMessage =
  | {
      code: string;
      purpose: 'verification';
  }
  | {
      purpose: 'passwordReset';
      token: string;
  };

export type AuthOperationContext = Pick<RecordAuthEventInput, 'actor' | 'request' | 'sessionId'>;
export type AuthSecondFactor = ArrayValues<typeof authSecondFactors>;

export interface AuthPrincipal {
    _id: Types.ObjectId;
}

/**
 * 傳給 realm `onEvent` 的驗證事件。
 */
export interface AuthRealmEvent extends RecordAuthEventInput {
    realm: string;
}

/**
 * 發出請求的用戶端資訊；IP 取自後端的可信代理設定。
 */
export interface AuthRequestInfo {
    ip?: string;
    userAgent?: string;
}

export interface AuthSession extends StoredAuthSession {
    id: string;
    principalId: string;
}

export interface RecordAuthEventInput {
    /**
     * 操作者；未提供時為帳號本人。
     */
    actor?: {
        principalId: string;
        realm: string;
    };
    factor?: AuthFactor;
    metadata?: UnknownRecord;
    principalId: string;
    request?: AuthRequestInfo;
    sessionId?: string;
    type: AuthEventType;
}

/**
 * 存在 Redis 的工作階段內容；除 lastActiveAt 與 idleTimeoutSeconds 外建立後不再變動。時間皆為毫秒時間戳。
 */
export interface StoredAuthSession {
    /**
     * QR Code 登入時，核准者的工作階段 ID。
     */
    approvedBySessionId?: string;
    createdAt: number;
    factors: AuthFactor[];
    generation: number;

    /**
     * 最後一次寫入時採用的閒置逾時；key 的存活時間以它計算，設定調高後仍須在這段時間內順延。
     */
    idleTimeoutSeconds: number;
    ip?: string;
    lastActiveAt: number;

    /**
     * 受限工作階段只能呼叫綁定因子的 API。
     */
    restricted: boolean;
    secretHash: string;
    userAgent?: string;
}
