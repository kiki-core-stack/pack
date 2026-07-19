import { Buffer } from 'node:buffer';
import {
    createHmac,
    randomBytes,
} from 'node:crypto';

import type {
    AuthenticationSessionPrincipalType,
    AuthenticationSessionQrCodeLoginStore,
} from '../../../../types/authentication-session';
import {
    generateAuthenticationSessionToken,
    parseAuthenticationSessionToken,
    tokenSelectorByteLength,
    tokenValidatorByteLength,
    verifyAuthenticationSessionTokenDigest,
} from '../../_token';
import type { ParsedAuthenticationSessionToken } from '../../_token';

import { createRedisAuthenticationSessionKeys } from './keys';
import { createRedisScriptRunner } from './script-runner';
import {
    approveAuthenticationSessionQrCodeLoginScript,
    completeAuthenticationSessionQrCodeLoginScript,
    createAuthenticationSessionQrCodeLoginScript,
} from './scripts/qr-code-login';

/** Redis request 依 state 決定是否已保存來源 Session 綁定資料。 */
type StoredAuthenticationSessionQrCodeLogin =
  | ApprovedStoredAuthenticationSessionQrCodeLogin
  | PendingStoredAuthenticationSessionQrCodeLogin;

interface ApprovedStoredAuthenticationSessionQrCodeLogin extends StoredAuthenticationSessionQrCodeLoginCommonData {
    /** 核准後的短效絕對到期時間。 */
    approvalExpiresAt: number;

    /** 完成登入前必須重新由權威資料驗證的主體快照。 */
    principalAuthenticationRevision: number;

    /** 核准來源 Session 所屬主體識別碼。 */
    principalId: string;

    /** 核准來源 Session 所屬主體種類。 */
    principalType: AuthenticationSessionPrincipalType;

    /** 核准此請求的來源 Session 身分與撤銷世代。 */
    sourceEpoch: string;

    /** 核准來源 Session 的 selector/id。 */
    sourceSessionId: string;

    /** discriminant，表示請求已進入短效完成窗口。 */
    state: 'approved';
}

/** 共用 selector 但 validator 完全獨立的 approval/completion capability。 */
interface AuthenticationSessionQrCodeLoginTokenPair {
    /** 來源裝置持有的完整核准 token。 */
    approvalToken: string;

    /** approval token 的 HMAC digest。 */
    approvalValidatorDigest: string;

    /** 目標裝置持有的完整完成 token。 */
    completionToken: string;

    /** completion token 的 HMAC digest。 */
    completionValidatorDigest: string;

    /** 兩個 token 共用的 Redis request selector。 */
    selector: string;
}

/** QR Login store 由外層 Session store 注入的完整安全設定。 */
interface CreateRedisAuthenticationSessionQrCodeLoginStoreOptions {
    /** 目標 Session 的完整 absolute TTL。 */
    absoluteTtlSeconds: number;

    /** approved request 的短效存活時間。 */
    approvalTtlSeconds: number;

    /** QR store 實際需要的最小 Redis command 集合。 */
    client: Pick<Bun.RedisClient, 'hmget' | 'send'>;

    /** 來源及目標 Session 共用的 idle TTL。 */
    idleTtlSeconds: number;

    /** 此 store 固定處理的主體種類。 */
    principalType: AuthenticationSessionPrincipalType;

    /** pending request 的等待核准期限。 */
    qrCodeLoginRequestTtlSeconds: number;

    /** capability 與正式 Session token 共用的 HMAC key。 */
    tokenHmacKey: string | Uint8Array;
}

/** 尚未由來源裝置核准的 request 不含任何 principal 資料。 */
interface PendingStoredAuthenticationSessionQrCodeLogin extends StoredAuthenticationSessionQrCodeLoginCommonData {
    /** discriminant，表示請求尚未由來源裝置核准。 */
    state: 'pending';
}

/** pending 與 approved request 都必須保存的目標裝置與 capability 資料。 */
interface StoredAuthenticationSessionQrCodeLoginCommonData {
    /** approval capability 的 HMAC digest。 */
    approvalValidatorDigest: string;

    /** completion capability 的 HMAC digest。 */
    completionValidatorDigest: string;

    /** 原始 pending request 的到期毫秒時間戳。 */
    expiresAt: number;

    /** 目標裝置建立 request 時的 IP。 */
    targetIp: string;

    /** 目標裝置建立 request 時的 User-Agent。 */
    targetUserAgent?: string;
}

/** HMGET 使用固定欄位順序，pending 狀態後半部欄位會是 null。 */
const storedAuthenticationSessionQrCodeLoginFields = [
    'approvalValidatorDigest',
    'expiresAt',
    'state',
    'targetIp',
    'targetUserAgent',
    'completionValidatorDigest',
    'approvalExpiresAt',
    'principalAuthenticationRevision',
    'principalId',
    'principalType',
    'sourceEpoch',
    'sourceSessionId',
] as const;

/** 建立與特定 principal type 及 Session 策略綁定的 QR Code Login store。 */
export function createRedisAuthenticationSessionQrCodeLoginStore(
    options: CreateRedisAuthenticationSessionQrCodeLoginStoreOptions,
): AuthenticationSessionQrCodeLoginStore {
    // 所有 TTL 與 HMAC 設定都由已驗證的外層 factory 傳入。
    const {
        absoluteTtlSeconds,
        approvalTtlSeconds,
        client,
        idleTtlSeconds,
        principalType,
        qrCodeLoginRequestTtlSeconds,
        tokenHmacKey,
    } = options;

    // QR request 與正式 Session 使用相同產品、環境及 principal namespace。
    const keys = createRedisAuthenticationSessionKeys(principalType);

    // 每個狀態轉移使用獨立 Lua runner，確保 Redis 內原子執行。
    const approveStoredRequest = createRedisScriptRunner<number>(client, approveAuthenticationSessionQrCodeLoginScript);
    const completeStoredRequest = createRedisScriptRunner<0 | [number, number]>(
        client,
        completeAuthenticationSessionQrCodeLoginScript,
    );

    const createStoredRequest = createRedisScriptRunner<string>(client, createAuthenticationSessionQrCodeLoginScript);

    /** 建立 pending request，回傳分別提供給來源與目標裝置的 token。 */
    async function create(input: Parameters<AuthenticationSessionQrCodeLoginStore['create']>[0]) {
        // 兩個 capability 共用 selector 定位同一 request，但 validator 各自獨立。
        const generated = generateAuthenticationSessionQrCodeLoginTokenPair(principalType, tokenHmacKey);

        // Redis 以 server time 原子建立 request 並回傳到期時間。
        const expiresAt = Number(
            await createStoredRequest(
                [keys.qrCodeLogin(generated.selector)],
                [
                    generated.approvalValidatorDigest,
                    input.ip,
                    input.userAgent ?? '',
                    generated.completionValidatorDigest,
                    qrCodeLoginRequestTtlSeconds,
                ],
            ),
        );

        // 明文 capability 僅在建立時回傳，Redis 只保存 digest。
        return {
            approvalToken: generated.approvalToken,
            completionToken: generated.completionToken,
            expiresAt,
        };
    }

    /** 讓來源裝置用 approval token 查詢目標裝置資訊與目前狀態。 */
    async function getApprovalRequest(approvalToken: string) {
        // 格式不正確時不查詢 Redis。
        const parsedToken = parseAuthenticationSessionToken(approvalToken);
        if (!parsedToken) return;

        // 讀取並嚴格解析 Redis request，畸形資料採失敗關閉。
        const request = parseStoredAuthenticationSessionQrCodeLogin(
            await client.hmget(keys.qrCodeLogin(parsedToken.selector), ...storedAuthenticationSessionQrCodeLoginFields),
            principalType,
        );

        // selector 只能定位資料；仍須用 approval domain digest 驗證完整 token。
        if (
            !request
            || !verifyAuthenticationSessionQrCodeLoginToken(
                'approval',
                principalType,
                parsedToken,
                request.approvalValidatorDigest,
                tokenHmacKey,
            )
        ) return;

        // approved 後只暴露更短的 approval expiry，讓來源裝置停止沿用原期限。
        return {
            expiresAt: request.state === 'approved' ? request.approvalExpiresAt : request.expiresAt,
            state: request.state,
            targetIp: request.targetIp,
            targetUserAgent: request.targetUserAgent,
        };
    }

    /** 已登入來源裝置以自己的有效 Session 核准 pending request。 */
    async function approve(input: Parameters<AuthenticationSessionQrCodeLoginStore['approve']>[0]) {
        // token 格式或 principal type 不符時拒絕跨 scope 核准。
        const parsedToken = parseAuthenticationSessionToken(input.approvalToken);
        if (!parsedToken || input.sourceSession.principalType !== principalType) return false;

        // sourceSession 必須來自同一 request 已成功完成的 Authentication Session 認證。
        const source = input.sourceSession;

        // Lua 同時驗證 capability、來源 Session、epoch、TTL 並切換為 approved。
        const result = await approveStoredRequest(
            [
                keys.qrCodeLogin(parsedToken.selector),
                keys.session(source.id),
                keys.epoch(source.principalId),
            ],
            [
                // approval digest 在送入 Redis 前才由完整 token 計算。
                getAuthenticationSessionQrCodeLoginTokenDigestBytes(
                    'approval',
                    principalType,
                    parsedToken.bytes,
                    tokenHmacKey,
                ).toString('base64url'),
                source.id,
                source.epoch,
                source.principalAuthenticationRevision,
                source.principalId,
                source.principalType,
                // Lua 以毫秒比較來源 Session idle 與核准期限。
                idleTtlSeconds * 1000,
                approvalTtlSeconds * 1000,
            ],
        );

        // 只有 pending request 成功轉為 approved 才回傳 true。
        return result === 1;
    }

    /** 目標裝置輪詢 completion token，核准後原子建立全新正式 Session。 */
    async function complete(input: Parameters<AuthenticationSessionQrCodeLoginStore['complete']>[0]) {
        // 格式錯誤的 completion token 不查詢 Redis。
        const parsedToken = parseAuthenticationSessionToken(input.completionToken);
        if (!parsedToken) return;

        // 先取得 request 狀態與完成階段需要的來源綁定資料。
        const request = parseStoredAuthenticationSessionQrCodeLogin(
            await client.hmget(keys.qrCodeLogin(parsedToken.selector), ...storedAuthenticationSessionQrCodeLoginFields),
            principalType,
        );

        // completion token 必須通過獨立 completion domain 的 HMAC 驗證。
        if (
            !request
            || !verifyAuthenticationSessionQrCodeLoginToken(
                'completion',
                principalType,
                parsedToken,
                request.completionValidatorDigest,
                tokenHmacKey,
            )
        ) return;

        // 尚未核准時不查詢主體資料，也不建立 Session。
        if (request.state === 'pending') return { state: 'pending' as const };

        // 核准後仍由權威資料確認主體存在、可登入且 revision 未變。
        if (
            !await input.validatePrincipal({
                principalAuthenticationRevision: request.principalAuthenticationRevision,
                principalId: request.principalId,
                principalType: request.principalType,
            })
        ) return;

        // 先使用 Redis TIME 建立目標 Session binding，與 Lua 完成時間維持同一時間來源。
        const [redisSeconds, redisMicroseconds] = await client.send('TIME', []) as [string, string];
        const redisNow = Number(redisSeconds) * 1000 + Math.floor(Number(redisMicroseconds) / 1000);

        // QR 登入視為全新登入，因此 absolute expiry 從目標裝置完成時重新計算。
        const binding = {
            absoluteExpiresAt: redisNow + absoluteTtlSeconds * 1000,
            epoch: request.sourceEpoch,
            principalAuthenticationRevision: request.principalAuthenticationRevision,
            principalId: request.principalId,
            principalType: request.principalType,
        };

        // 為目標裝置產生完全獨立的正式 Session token。
        const generated = generateAuthenticationSessionToken(
            binding,
            tokenHmacKey,
        );

        // Lua 最後重新確認 request、來源 Session 與 epoch，再原子建 Session 及消耗 request。
        const completed = await completeStoredRequest(
            [
                keys.qrCodeLogin(parsedToken.selector),
                keys.session(request.sourceSessionId),
                keys.epoch(request.principalId),
                keys.session(generated.selector),
                keys.index(request.principalId, request.sourceEpoch),
            ],
            [
                // 以 completion domain digest 證明呼叫端持有目標裝置 capability。
                getAuthenticationSessionQrCodeLoginTokenDigestBytes(
                    'completion',
                    principalType,
                    parsedToken.bytes,
                    tokenHmacKey,
                ).toString('base64url'),
                request.sourceSessionId,
                request.sourceEpoch,
                request.principalAuthenticationRevision,
                request.principalId,
                request.principalType,
                binding.absoluteExpiresAt,
                idleTtlSeconds,
                generated.selector,
                input.ip,
                input.userAgent ?? '',
                generated.validatorDigest,
            ],
        );

        // 0 表示在權威驗證期間發生到期、撤銷或並行完成。
        if (!Array.isArray(completed)) return;

        // Redis 回傳實際 Cookie Max-Age 與建立時間，避免使用應用節點的推測值。
        const [cookieMaxAgeSeconds, now] = completed;

        // 回傳與一般帳密登入相同結構的全新 Session issuance result。
        return {
            cookieMaxAgeSeconds,
            session: {
                ...binding,
                id: generated.selector,
                lastActiveAt: now,
                lastActiveIp: input.ip,
                loggedAt: now,
                loginIp: input.ip,
                userAgent: input.userAgent,
            },
            state: 'completed' as const,
            token: generated.token,
        };
    }

    // 對外公開完整但最小的 QR Login 狀態機操作。
    return {
        approve,
        complete,
        create,
        getApprovalRequest,
    };
}

/** 一次產生共用 selector、獨立 validator 的 approval 與 completion token。 */
function generateAuthenticationSessionQrCodeLoginTokenPair(
    principalType: AuthenticationSessionPrincipalType,
    tokenHmacKey: string | Uint8Array,
): AuthenticationSessionQrCodeLoginTokenPair {
    // 共用 selector 讓兩種 capability 定位同一筆 Redis request。
    const selector = randomBytes(tokenSelectorByteLength);

    // approval token 使用自己的 256-bit validator。
    const approvalBytes = Buffer.concat([
        selector,
        randomBytes(tokenValidatorByteLength),
    ]);

    // completion token 使用另一份獨立的 256-bit validator。
    const completionBytes = Buffer.concat([
        selector,
        randomBytes(tokenValidatorByteLength),
    ]);

    // 兩種 digest 另綁定 use domain，即使 bytes 外洩也不能跨用途使用。
    return {
        approvalToken: approvalBytes.toString('base64url'),
        approvalValidatorDigest: getAuthenticationSessionQrCodeLoginTokenDigestBytes(
            'approval',
            principalType,
            approvalBytes,
            tokenHmacKey,
        ).toString('base64url'),
        completionToken: completionBytes.toString('base64url'),
        completionValidatorDigest: getAuthenticationSessionQrCodeLoginTokenDigestBytes(
            'completion',
            principalType,
            completionBytes,
            tokenHmacKey,
        ).toString('base64url'),
        selector: selector.toString('base64url'),
    };
}

/** 計算 QR capability 專用的 HMAC-SHA256 digest。 */
function getAuthenticationSessionQrCodeLoginTokenDigestBytes(
    use: 'approval' | 'completion',
    principalType: AuthenticationSessionPrincipalType,
    tokenBytes: Uint8Array,
    tokenHmacKey: string | Uint8Array,
) {
    // Bun runtime 優先使用原生 CryptoHasher，其他相容環境使用 Node HMAC。
    const hasher = typeof Bun !== 'undefined'
        ? new Bun.CryptoHasher('sha256', tokenHmacKey)
        : createHmac('sha256', tokenHmacKey);

    // 固定 domain、principal type 與 capability 用途，隔離一般 Session 及另一種 capability。
    hasher.update(JSON.stringify([
        'authentication-session-qr-code-login',
        principalType,
        use,
    ]));

    // 完整 selector + validator bytes 共同參與 HMAC。
    hasher.update(tokenBytes);

    // 保留 bytes 供共用 timing-safe verifier 直接比對。
    return hasher.digest();
}

/** 依固定 HMGET 順序解析 pending 或 approved Redis request。 */
function parseStoredAuthenticationSessionQrCodeLogin(
    row: (null | string)[],
    principalType: AuthenticationSessionPrincipalType,
): StoredAuthenticationSessionQrCodeLogin | undefined {
    // 解構順序必須與 storedAuthenticationSessionQrCodeLoginFields 一致。
    const [
        approvalValidatorDigest,
        expiresAtValue,
        state,
        targetIp,
        targetUserAgent,
        completionValidatorDigest,
        approvalExpiresAtValue,
        principalAuthenticationRevisionValue,
        principalId,
        storedPrincipalType,
        sourceEpoch,
        sourceSessionId,
    ] = row;

    // 先驗證兩種 state 都必須存在的 capability、期限與目標裝置資料。
    if (
        !approvalValidatorDigest
        || expiresAtValue == null
        || (state !== 'approved' && state !== 'pending')
        || !targetIp
        || !completionValidatorDigest
    ) return;

    // Redis wire format 是字串，只在解析邊界轉成 number。
    const expiresAt = Number(expiresAtValue);
    if (!Number.isSafeInteger(expiresAt)) return;

    // 建立兩種狀態共用的已驗證資料。
    const common: StoredAuthenticationSessionQrCodeLoginCommonData = {
        approvalValidatorDigest,
        completionValidatorDigest,
        expiresAt,
        targetIp,
        targetUserAgent: targetUserAgent || undefined,
    };

    // pending 不應要求或信任尚未寫入的 principal/source 欄位。
    if (state === 'pending') {
        return {
            ...common,
            state,
        };
    }

    // approved 必須具備完成階段所需的全部來源 Session 綁定資料。
    if (
        approvalExpiresAtValue == null
        || principalAuthenticationRevisionValue == null
        || !principalId
        || storedPrincipalType !== principalType
        || !sourceEpoch
        || !sourceSessionId
    ) return;

    // 將核准期限與 revision 從 Redis 字串轉回安全整數。
    const approvalExpiresAt = Number(approvalExpiresAtValue);
    const principalAuthenticationRevision = Number(principalAuthenticationRevisionValue);

    // 畸形期限或負 revision 一律拒絕，不讓資料進入權威驗證及 Lua。
    if (
        !Number.isSafeInteger(approvalExpiresAt)
        || !Number.isSafeInteger(principalAuthenticationRevision)
        || principalAuthenticationRevision < 0
    ) return;

    // 回傳完整 approved discriminated union 成員。
    return {
        ...common,
        approvalExpiresAt,
        principalAuthenticationRevision,
        principalId,
        principalType,
        sourceEpoch,
        sourceSessionId,
        state: 'approved',
    };
}

/** 以指定 capability domain 重算 digest 並固定時間比對 Redis 保存值。 */
function verifyAuthenticationSessionQrCodeLoginToken(
    use: 'approval' | 'completion',
    principalType: AuthenticationSessionPrincipalType,
    parsedToken: ParsedAuthenticationSessionToken,
    validatorDigest: string,
    tokenHmacKey: string | Uint8Array,
) {
    // digest 的 use 參數阻止 approval/completion token 互換使用。
    const actualDigest = getAuthenticationSessionQrCodeLoginTokenDigestBytes(
        use,
        principalType,
        parsedToken.bytes,
        tokenHmacKey,
    );

    // 共用一般 Session 的長度檢查與 timingSafeEqual 實作。
    return verifyAuthenticationSessionTokenDigest(actualDigest, validatorDigest);
}
