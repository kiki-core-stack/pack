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

/** 裝置列表在持久化資料之外補上是否為目前工作階段。 */
export interface AuthenticationSessionListItemData extends AuthenticationSessionData {
    /** 此項目是否對應呼叫端目前使用中的 Session。 */
    isCurrent: boolean;
}
