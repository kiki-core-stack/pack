import type { AuthenticationSessionPrincipalType } from '../authentication-session';

export interface AuthenticationSessionData {
    /** 絕對到期時間，不會因活動而延長。 */
    absoluteExpiresAt: number;

    /** 主體的撤銷世代；revokeAll 後舊世代全部失效。 */
    epoch: string;

    /** 對外使用的工作階段識別碼。 */
    id: string;

    /** 最近一次實際 touch 的毫秒時間戳。 */
    lastActiveAt: number;

    /** 最近一次實際 touch 的來源 IP。 */
    lastActiveIp: string;

    /** 初次登入的毫秒時間戳。 */
    loggedAt: number;

    /** 初次登入的來源 IP。 */
    loginIp: string;

    /** 用來使密碼或安全設定異動後的舊工作階段失效。 */
    principalAuthenticationRevision: number;

    /** 工作階段所屬主體的識別碼。 */
    principalId: string;

    /** 工作階段所屬主體的種類。 */
    principalType: AuthenticationSessionPrincipalType;

    /** 建立或輪換時記錄的原始 User-Agent。 */
    userAgent?: string;
}

/** 裝置列表只公開管理登入裝置實際需要的資料。 */
export interface AuthenticationSessionListItemData extends Pick<
    AuthenticationSessionData,
    | 'id'
    | 'lastActiveAt'
    | 'lastActiveIp'
    | 'loggedAt'
    | 'loginIp'
    | 'userAgent'
> {
    /** 此項目是否對應呼叫端目前使用中的 Session。 */
    isCurrent: boolean;
}

/** 已登入來源裝置查詢 QR Code 登入請求時可見的安全範圍資料。 */
export interface AuthenticationSessionQrCodeLoginApprovalRequestData {
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
export interface AuthenticationSessionQrCodeLoginCreationData {
    /** 交由已登入來源裝置掃描並核准的能力 token。 */
    approvalToken: string;

    /** 留在目標裝置輪詢並完成請求的能力 token。 */
    completionToken: string;

    /** pending 請求的毫秒到期時間戳。 */
    expiresAt: number;
}
