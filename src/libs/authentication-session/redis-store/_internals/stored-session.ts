import type { AuthenticationSessionPrincipalType } from '../../../../types/authentication-session';
import type { AuthenticationSessionData } from '../../../../types/data/authentication-session';

/** Redis hash 比公開 Session data 多保存不可回傳給客戶端的 validator digest。 */
interface StoredAuthenticationSessionData extends AuthenticationSessionData {
    validatorDigest: string;
}

/** HMGET 與 Lua HMSET 共用固定欄位順序；解析器依此順序解構資料。 */
export const storedAuthenticationSessionDataFields = [
    'absoluteExpiresAt',
    'epoch',
    'id',
    'lastActiveAt',
    'lastActiveIp',
    'loggedAt',
    'loginIp',
    'principalAuthenticationRevision',
    'principalId',
    'userAgent',
] as const;

export const storedAuthenticationSessionFields = [
    // 公開 Session 欄位維持與上方完全相同的順序。
    ...storedAuthenticationSessionDataFields,
    // digest 固定放在最後，讓 data-only list 查詢可以省略此敏感欄位。
    'validatorDigest',
] as const;

/** 解析驗證流程需要的完整 Redis Session hash，包含 validator digest。 */
export function parseStoredAuthenticationSession(
    values: (null | string)[],
    expectedPrincipalType: AuthenticationSessionPrincipalType,
): StoredAuthenticationSessionData | undefined {
    // 先使用共用解析器驗證所有公開 Session 欄位。
    const session = parseStoredAuthenticationSessionData(values, expectedPrincipalType);

    // 完整欄位的最後一格固定是 validator digest。
    const validatorDigest = values[storedAuthenticationSessionDataFields.length];

    // 任一必要欄位缺失都採失敗關閉，不接受部分資料。
    if (!session || validatorDigest == null) return;

    return {
        ...session,
        validatorDigest,
    };
}

/** 將 Redis HMGET 字串陣列轉回型別安全的公開 Session data。 */
export function parseStoredAuthenticationSessionData(
    values: (null | string)[],
    expectedPrincipalType: AuthenticationSessionPrincipalType,
): AuthenticationSessionData | undefined {
    // 解構順序必須與 storedAuthenticationSessionDataFields 完全一致。
    const [
        absoluteExpiresAt,
        epoch,
        id,
        lastActiveAt,
        lastActiveIp,
        loggedAt,
        loginIp,
        principalAuthenticationRevision,
        principalId,
        userAgent,
    ] = values;

    // 所有必要欄位都必須存在；principal type 由目前 store 的固定範圍提供。
    if (
        absoluteExpiresAt == null
        || epoch == null
        || id == null
        || lastActiveAt == null
        || lastActiveIp == null
        || loggedAt == null
        || loginIp == null
        || principalAuthenticationRevision == null
        || principalId == null
    ) return;

    // Redis 回傳字串；僅在儲存邊界將數值欄位轉回 number。
    const parsedAbsoluteExpiresAt = Number(absoluteExpiresAt);
    const parsedLastActiveAt = Number(lastActiveAt);
    const parsedLoggedAt = Number(loggedAt);
    const parsedPrincipalAuthenticationRevision = Number(principalAuthenticationRevision);

    // 時間與 revision 必須是非負安全整數，畸形資料一律拒絕。
    if (
        !Number.isSafeInteger(parsedAbsoluteExpiresAt)
        || parsedAbsoluteExpiresAt < 0
        || !Number.isSafeInteger(parsedLastActiveAt)
        || parsedLastActiveAt < 0
        || !Number.isSafeInteger(parsedLoggedAt)
        || parsedLoggedAt < 0
        || !Number.isSafeInteger(parsedPrincipalAuthenticationRevision)
        || parsedPrincipalAuthenticationRevision < 0
    ) return;

    // 回傳已完成必要欄位與數值驗證的 domain data。
    return {
        absoluteExpiresAt: parsedAbsoluteExpiresAt,
        epoch,
        id,
        lastActiveAt: parsedLastActiveAt,
        lastActiveIp,
        loggedAt: parsedLoggedAt,
        loginIp,
        principalAuthenticationRevision: parsedPrincipalAuthenticationRevision,
        principalId,
        principalType: expectedPrincipalType,
        // Redis 以空字串表示未提供 optional User-Agent。
        userAgent: userAgent || undefined,
    };
}
