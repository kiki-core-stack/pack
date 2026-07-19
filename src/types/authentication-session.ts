import type {
    AuthenticationSessionData,
    AuthenticationSessionListItemData,
} from './data/authentication-session';

export type AuthenticationSessionPrincipalType = 'admin';

/**
 * 必須根據權威資料採取失敗關閉策略，確認主體仍存在、允許認證且認證版本相符。
 * 安全性異動必須原子遞增版本並撤銷既有工作階段；已完成驗證的進行中請求仍可能完成。
 */
export type AuthenticationSessionPrincipalValidator = (data: AuthenticationSessionPrincipalValidationData) => Promise<
    boolean
>;

export type AuthenticationSessionQrCodeLoginCompletionResult =
  // 完成時回傳可直接寫入 Cookie 的全新工作階段。
  | (AuthenticationSessionIssuanceResult & { state: 'completed' })
  // 尚未由來源裝置核准時，讓目標裝置繼續輪詢。
  | { state: 'pending' };

/** 已登入來源裝置核准 QR Code 登入所需資料。 */
export interface ApproveAuthenticationSessionQrCodeLoginInput {
    /** QR 畫面提供給已登入來源裝置的核准能力 token。 */
    approvalToken: string;

    /** 已由一般 Session 認證流程驗證成功的來源工作階段。 */
    sourceSession: AuthenticationSessionData;
}

/** 以 Cookie token 驗證既有工作階段所需資料。 */
export interface AuthenticateAuthenticationSessionInput {
    /** 本次請求的可信任客戶端 IP。 */
    ip: string;

    /** 可注入的毫秒時間戳，主要供確定性測試使用。 */
    now?: number;

    /** Cookie 內取得的完整 opaque bearer token。 */
    token: string;

    /** 業務端提供的權威主體驗證器。 */
    validatePrincipal: AuthenticationSessionPrincipalValidator;
}

/** 建立或輪換工作階段後回傳給 HTTP 層的簽發結果。 */
export interface AuthenticationSessionIssuanceResult {
    /** 依 absolute TTL 計算的 Cookie 保存秒數；最終有效期限仍由伺服端判斷。 */
    cookieMaxAgeSeconds: number;

    /** 已建立且可交給授權層使用的工作階段資料。 */
    session: AuthenticationSessionData;

    /** 僅在簽發當下回傳一次的完整 bearer token。 */
    token: string;
}

/** 不需要持有簽章金鑰即可使用的工作階段管理介面。 */
export interface AuthenticationSessionManager {
    /** 列出指定主體的全部有效工作階段。 */
    list: (input: ListAuthenticationSessionsInput) => Promise<AuthenticationSessionListItemData[]>;

    /** 依 Session id 撤銷單一工作階段。 */
    revoke: (sessionId: string) => Promise<boolean>;

    /** 以世代切換撤銷指定主體的全部工作階段。 */
    revokeAll: (principalId: string) => Promise<void>;
}

/** 交由業務端權威資料來源核驗的主體識別資訊。 */
export interface AuthenticationSessionPrincipalValidationData {
    /** Session 建立時記錄的主體認證版本。 */
    principalAuthenticationRevision: number;

    /** 權威資料來源中的主體識別碼。 */
    principalId: string;

    /** 權威資料查詢所屬的主體種類。 */
    principalType: AuthenticationSessionPrincipalType;
}

/** 已登入來源裝置查詢 QR Code 登入請求時可見的安全範圍資料。 */
export interface AuthenticationSessionQrCodeLoginApprovalRequest {
    /** 目前狀態實際有效到期的毫秒時間戳。 */
    expiresAt: number;

    /** 請求仍等待核准或已進入短效完成窗口。 */
    state: 'approved' | 'pending';

    /** 目標裝置建立請求時的 IP。 */
    targetIp: string;

    /** 目標裝置建立請求時的原始 User-Agent。 */
    targetUserAgent?: string;
}

/** 建立 QR Code 登入請求後分別交給來源與目標裝置的能力 token。 */
export interface AuthenticationSessionQrCodeLoginCreationResult {
    /** 交由已登入來源裝置掃描並核准的能力 token。 */
    approvalToken: string;

    /** 留在目標裝置輪詢並完成請求的能力 token。 */
    completionToken: string;

    /** pending 請求的毫秒到期時間戳。 */
    expiresAt: number;
}

/** QR Code 跨裝置登入的完整狀態機介面。 */
export interface AuthenticationSessionQrCodeLoginStore {
    /** 來源裝置核准 pending request。 */
    approve: (input: ApproveAuthenticationSessionQrCodeLoginInput) => Promise<boolean>;

    /** 目標裝置輪詢並在核准後建立正式 Session。 */
    complete: (input: CompleteAuthenticationSessionQrCodeLoginInput) => Promise<
        AuthenticationSessionQrCodeLoginCompletionResult | undefined
    >;

    /** 目標裝置建立新的 pending request。 */
    create: (input: CreateAuthenticationSessionQrCodeLoginInput) => Promise<
        AuthenticationSessionQrCodeLoginCreationResult
    >;

    /** 來源裝置讀取待核准目標裝置資訊與狀態。 */
    getApprovalRequest: (approvalToken: string) => Promise<AuthenticationSessionQrCodeLoginApprovalRequest | undefined>;
}

/** 可簽發及驗證 token 的完整工作階段儲存介面。 */
export interface AuthenticationSessionStore extends AuthenticationSessionManager {
    /** 驗證既有 bearer token 並回傳有效 Session。 */
    authenticate: (input: AuthenticateAuthenticationSessionInput) => Promise<AuthenticationSessionData | undefined>;

    /** 一般登入成功後建立 Session。 */
    create: (input: CreateAuthenticationSessionInput) => Promise<AuthenticationSessionIssuanceResult>;

    /** QR Code 跨裝置登入子介面。 */
    qrCodeLogin: AuthenticationSessionQrCodeLoginStore;

    /** 原子輪換既有 Session token。 */
    rotate: (input: RotateAuthenticationSessionInput) => Promise<AuthenticationSessionIssuanceResult | undefined>;
}

/** 目標裝置以 completion token 完成登入所需資料。 */
export interface CompleteAuthenticationSessionQrCodeLoginInput {
    /** 目標裝置保存的 completion capability token。 */
    completionToken: string;

    /** 完成登入當下的可信任客戶端 IP。 */
    ip: string;

    /** 完成登入裝置的原始 User-Agent。 */
    userAgent?: string;

    /** 建立正式 Session 前執行的權威主體驗證器。 */
    validatePrincipal: AuthenticationSessionPrincipalValidator;
}

/** 一般登入成功後建立工作階段所需資料。 */
export interface CreateAuthenticationSessionInput {
    /** 一般登入當下的可信任客戶端 IP。 */
    ip: string;

    /** 可注入的毫秒時間戳，主要供確定性測試使用。 */
    now?: number;

    /** 登入完成時權威主體的認證版本。 */
    principalAuthenticationRevision: number;

    /** 登入主體的識別碼。 */
    principalId: string;

    /** 登入裝置的原始 User-Agent。 */
    userAgent?: string;
}

/** 目標裝置建立 QR Code 登入請求時留下的裝置資訊。 */
export interface CreateAuthenticationSessionQrCodeLoginInput {
    /** 顯示 QR Code 的目標裝置 IP。 */
    ip: string;

    /** 顯示 QR Code 的目標裝置 User-Agent。 */
    userAgent?: string;
}

/** 列出指定主體全部有效工作階段所需資料。 */
export interface ListAuthenticationSessionsInput {
    /** 呼叫端目前 Session id，用於列表置頂標記。 */
    currentSessionId?: string;

    /** 可注入的毫秒時間戳，主要供確定性測試使用。 */
    now?: number;

    /** 要列出工作階段的主體識別碼。 */
    principalId: string;
}

/** 輪換既有 token 時額外驗證主體歸屬及更新裝置資訊。 */
export interface RotateAuthenticationSessionInput extends AuthenticateAuthenticationSessionInput {
    /** 額外確認 token 實際歸屬的主體識別碼。 */
    principalId: string;

    /** 輪換後要記錄的新 User-Agent；未提供時沿用舊值。 */
    userAgent?: string;
}
