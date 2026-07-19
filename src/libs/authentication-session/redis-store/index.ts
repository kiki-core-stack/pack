import { Buffer } from 'node:buffer';

import { nanoid } from 'nanoid';

import type {
    AuthenticateAuthenticationSessionInput,
    AuthenticationSessionManager,
    AuthenticationSessionPrincipalType,
    AuthenticationSessionStore,
    CreateAuthenticationSessionInput,
    ListAuthenticationSessionsInput,
    RotateAuthenticationSessionInput,
} from '../../../types/authentication-session';
import type {
    AuthenticationSessionData,
    AuthenticationSessionListItemData,
} from '../../../types/data/authentication-session';
import {
    generateAuthenticationSessionToken,
    parseAuthenticationSessionToken,
    verifyAuthenticationSessionToken,
} from '../_token';
import type { ParsedAuthenticationSessionToken } from '../_token';

import { createRedisAuthenticationSessionKeys } from './_internals/keys';
import { createRedisAuthenticationSessionQrCodeLoginStore } from './_internals/qr-code-login';
import { createRedisScriptRunner } from './_internals/script-runner';
import {
    createAuthenticationSessionScript,
    finalizeAuthenticationSessionScript,
    initializeAuthenticationSessionEpochScript,
    revokeAllAuthenticationSessionsScript,
    revokeAuthenticationSessionScript,
    rotateAuthenticationSessionScript,
} from './_internals/scripts';
import {
    parseStoredAuthenticationSession,
    parseStoredAuthenticationSessionData,
    storedAuthenticationSessionDataFields,
    storedAuthenticationSessionFields,
} from './_internals/stored-session';

/** 只提供列表與撤銷功能的管理端依賴，不需要 token HMAC key。 */
export interface RedisAuthenticationSessionManagerOptions {
    /** 管理介面只要求列表與撤銷實際使用的 Redis commands。 */
    client: Pick<Bun.RedisClient, 'get' | 'hmget' | 'send' | 'zrange' | 'zrem'>;

    /** 固定此 manager 可管理的主體種類及 Redis key scope。 */
    principalType: AuthenticationSessionPrincipalType;
}

/** 完整 Session store 的 TTL、簽章金鑰與 QR Login 設定。 */
export interface RedisAuthenticationSessionStoreOptions extends RedisAuthenticationSessionManagerOptions {
    /** Session 絕對存活上限，預設 30 天。 */
    absoluteTtlSeconds?: number;

    /** Session 最大閒置時間，預設 7 天。 */
    idleTtlSeconds?: number;

    /** QR 請求核准後的短效完成窗口，預設 5 秒。 */
    qrCodeLoginApprovalTtlSeconds?: number;

    /** QR pending request 的等待核准期限，預設 60 秒。 */
    qrCodeLoginRequestTtlSeconds?: number;

    /** HMAC-SHA256 金鑰，至少包含 32 bytes。 */
    tokenHmacKey: string | Uint8Array;

    /** 更新最近活動資訊的最小間隔，預設 10 分鐘。 */
    touchIntervalSeconds?: number;
}

/** 通過 token、TTL、主體及 Redis 最終確認後的內部驗證結果。 */
interface ValidatedAuthenticationSession {
    /** 已移除內部 validator digest 的公開 Session data。 */
    session: AuthenticationSessionData;

    /** rotate Lua 最終確認舊 token 所需的 digest。 */
    validatorDigest: string;
}

/** 列表以固定批次並行 HMGET，避免一次建立無上限的 Redis 命令陣列。 */
const authenticationSessionListReadBatchSize = 100;

/** 工作階段最多存在 30 天，活動不會延長此期限。 */
const defaultAbsoluteTtlSeconds = 60 * 60 * 24 * 30;

/** 超過 7 天沒有有效活動就視為閒置到期。 */
const defaultIdleTtlSeconds = 60 * 60 * 24 * 7;

/** 最多每 10 分鐘更新一次活動時間，降低 Redis 寫入量。 */
const defaultTouchIntervalSeconds = 60 * 10;

/** 已由來源裝置核准後，目標裝置必須在 5 秒內完成兌換。 */
const defaultQrCodeLoginApprovalTtlSeconds = 5;

/** QR 登入請求建立後最多等待來源裝置掃描 60 秒。 */
const defaultQrCodeLoginRequestTtlSeconds = 60;

/** 驗證所有秒數設定能安全換算成 JavaScript 毫秒時間戳。 */
function assertValidAuthenticationSessionDuration(name: string, value: number, minimum: number) {
    // 拒絕小數、越界值及換算後超出 safe integer 的期限。
    if (
        !Number.isSafeInteger(value)
        || value < minimum
        || !Number.isSafeInteger(Date.now() + value * 1000)
    ) throw new TypeError(`${name} must be a safe integer greater than or equal to ${minimum}`);
}

/** 建立不持有 HMAC key 的 Session 列表與撤銷管理介面。 */
export function createRedisAuthenticationSessionManager(
    options: RedisAuthenticationSessionManagerOptions,
): AuthenticationSessionManager {
    // principalType 在建構時固定，確保所有 key 都落在同一身分類別。
    const { client, principalType } = options;
    const keys = createRedisAuthenticationSessionKeys(principalType);

    // 預先建立具 NOSCRIPT 自動恢復能力的 Lua runner。
    const revokeStoredSession = createRedisScriptRunner<number>(client, revokeAuthenticationSessionScript);
    const revokeAllStoredSessions = createRedisScriptRunner<string>(client, revokeAllAuthenticationSessionsScript);

    /** 列出指定主體目前 epoch 下尚未到期的全部工作階段。 */
    async function list(input: ListAuthenticationSessionsInput) {
        // 先取得目前 epoch；沒有 epoch 代表從未建立或已撤銷全部 Session。
        const epochKey = keys.epoch(input.principalId);
        const epoch = await client.get(epochKey);

        if (!epoch) return [];

        // Sorted Set score 保存有效期限，只讀取嚴格晚於目前時間的 selector。
        const indexKey = keys.index(input.principalId, epoch);
        const now = input.now ?? Date.now();
        const activeScoreMinimum = `(${now}`;
        const selectors = await client.zrange(indexKey, '+inf', activeScoreMinimum, 'BYSCORE', 'REV');

        // 分批讀取 Session hash，避免單一帳號的大量 Session 同時壓入事件迴圈。
        const list: AuthenticationSessionListItemData[] = [];
        for (let index = 0; index < selectors.length; index += authenticationSessionListReadBatchSize) {
            const batch = selectors.slice(index, index + authenticationSessionListReadBatchSize);
            const rows = await Promise.all(
                batch.map(
                    async (selector) => [
                        selector,
                        await client.hmget(
                            keys.session(selector),
                            ...storedAuthenticationSessionDataFields,
                        ),
                    ] as const,
                ),
            );

            // 索引與 hash 可能因非同步過期不同步，順便收集需要移除的殘留 selector。
            const staleSelectors: string[] = [];

            rows.forEach(([selector, row]) => {
                // Redis 資料畸形、已絕對到期或 epoch 不符時不得回傳。
                const session = parseStoredAuthenticationSessionData(row, principalType);
                if (
                    !session
                    || session.absoluteExpiresAt <= now
                    || session.epoch !== epoch
                ) {
                    staleSelectors.push(selector);
                    return;
                }

                // currentSessionId 只產生 isCurrent 顯示標記並影響排序，不參與安全判斷。
                list.push({
                    ...session,
                    isCurrent: session.id === input.currentSessionId,
                });
            });

            // 批次清除殘留 index member，不需要同步刪除已不存在的 hash。
            if (staleSelectors.length > 0) {
                await client.zrem(indexKey, staleSelectors[0] as string, ...staleSelectors.slice(1));
            }
        }

        // 讀取期間若 revokeAll 改變 epoch，整份快照作廢，避免回傳舊世代 Session。
        if (await client.get(epochKey) !== epoch) return [];

        // 目前裝置永遠第一，其餘依最近活動、登入時間及 id 穩定排序。
        list.sort((a, b) =>
            Number(b.isCurrent) - Number(a.isCurrent)
            || b.lastActiveAt - a.lastActiveAt
            || b.loggedAt - a.loggedAt
            || a.id.localeCompare(b.id),
        );

        return list;
    }

    /** 原子撤銷單一 Session 並從對應主體 index 移除。 */
    async function revoke(sessionId: string) {
        // 先讀取 index 定位所需欄位；缺少資料代表 Session 已不存在。
        const sessionKey = keys.session(sessionId);
        const [epoch, principalId] = await client.hmget(sessionKey, 'epoch', 'principalId');

        if (!epoch || !principalId) return false;

        // Lua 會再次比對 epoch 與 principalId，避免讀取後遭替換的競態。
        const revokeResult = await revokeStoredSession(
            [
                sessionKey,
                keys.index(principalId, epoch),
            ],
            [
                epoch,
                principalId,
            ],
        );

        // 只有實際刪除符合資料的 Session 才回傳 true。
        return revokeResult === 1;
    }

    /** 以 epoch 世代切換立即使指定主體的全部既有 Session 失效。 */
    async function revokeAll(principalId: string) {
        // Lua 原子刪除並回傳舊 epoch；後續認證因 epoch 不存在立即失敗。
        const epochKey = keys.epoch(principalId);
        const oldEpoch = await revokeAllStoredSessions([epochKey], []);
        if (!oldEpoch) return;

        // 舊 Session hash 交由自身 TTL 回收，只非同步 unlink 不再使用的 index。
        const indexKey = keys.index(principalId, oldEpoch);
        await client.send('UNLINK', [indexKey]);
    }

    // 管理介面刻意不暴露 create/authenticate，供跨服務安全撤銷使用。
    return {
        list,
        revoke,
        revokeAll,
    };
}

/** 建立可簽發、認證、輪換、QR 登入及撤銷的完整 Redis Session store。 */
export function createRedisAuthenticationSessionStore(
    options: RedisAuthenticationSessionStoreOptions,
): AuthenticationSessionStore {
    // 套用安全預設值，同時允許產品依需求覆寫。
    const {
        absoluteTtlSeconds = defaultAbsoluteTtlSeconds,
        client,
        idleTtlSeconds = defaultIdleTtlSeconds,
        principalType,
        qrCodeLoginApprovalTtlSeconds = defaultQrCodeLoginApprovalTtlSeconds,
        qrCodeLoginRequestTtlSeconds = defaultQrCodeLoginRequestTtlSeconds,
        tokenHmacKey,
        touchIntervalSeconds = defaultTouchIntervalSeconds,
    } = options;

    // 在建立任何 runner 或發出 Redis 命令前完整驗證設定。
    assertValidAuthenticationSessionDuration('absoluteTtlSeconds', absoluteTtlSeconds, 1);
    assertValidAuthenticationSessionDuration('idleTtlSeconds', idleTtlSeconds, 1);
    assertValidAuthenticationSessionDuration('touchIntervalSeconds', touchIntervalSeconds, 0);
    assertValidAuthenticationSessionDuration('qrCodeLoginApprovalTtlSeconds', qrCodeLoginApprovalTtlSeconds, 1);
    assertValidAuthenticationSessionDuration('qrCodeLoginRequestTtlSeconds', qrCodeLoginRequestTtlSeconds, 1);

    // touch 必須早於 idle expiry，否則活動中的 Session 仍可能在下次 touch 前到期。
    if (touchIntervalSeconds >= idleTtlSeconds) {
        throw new TypeError('touchIntervalSeconds must be less than idleTtlSeconds');
    }

    // 核准後窗口不得比整體請求生命週期更長。
    if (qrCodeLoginApprovalTtlSeconds > qrCodeLoginRequestTtlSeconds) {
        throw new TypeError('qrCodeLoginApprovalTtlSeconds must be less than or equal to qrCodeLoginRequestTtlSeconds');
    }

    // 字串以實際 UTF-8 byte length 計算，不以 JavaScript code unit 數量判斷。
    const tokenHmacKeyByteLength = typeof tokenHmacKey === 'string'
        ? Buffer.byteLength(tokenHmacKey)
        : tokenHmacKey.byteLength;

    // HMAC key 至少要求 256-bit 輸入材料。
    if (tokenHmacKeyByteLength < 32) {
        throw new TypeError('authentication session token HMAC key must contain at least 32 bytes');
    }

    // 共用無簽章管理介面，避免重複實作 list/revoke/revokeAll。
    const manager = createRedisAuthenticationSessionManager(options);
    const keys = createRedisAuthenticationSessionKeys(principalType);
    // QR Login 共用相同 principal namespace、HMAC key 與 Session TTL 策略。
    const qrCodeLogin = createRedisAuthenticationSessionQrCodeLoginStore({
        absoluteTtlSeconds,
        approvalTtlSeconds: qrCodeLoginApprovalTtlSeconds,
        client,
        idleTtlSeconds,
        principalType,
        qrCodeLoginRequestTtlSeconds,
        tokenHmacKey,
    });

    // 每個 Lua runner 會快取 script SHA，並在 Redis 清除 cache 後自動重新載入。
    const initializeEpoch = createRedisScriptRunner<string>(client, initializeAuthenticationSessionEpochScript);
    const createStoredSession = createRedisScriptRunner<number>(client, createAuthenticationSessionScript);
    const finalizeAuthentication = createRedisScriptRunner<number>(client, finalizeAuthenticationSessionScript);
    const rotateStoredSession = createRedisScriptRunner<number>(client, rotateAuthenticationSessionScript);

    /** 一般登入成功後建立全新 Session 與 opaque token。 */
    async function create(input: CreateAuthenticationSessionInput) {
        // revision 會進入 HMAC binding，必須先保證是可穩定序列化的非負整數。
        if (!Number.isSafeInteger(input.principalAuthenticationRevision) || input.principalAuthenticationRevision < 0) {
            throw new TypeError('principalAuthenticationRevision must be a non-negative safe integer');
        }

        // absolute expiry 固定於建立時間；實際 Redis TTL 取 absolute 與 idle 的較早者。
        const now = input.now ?? Date.now();
        const absoluteExpiresAt = now + absoluteTtlSeconds * 1000;
        const { expiresAt, ttlSeconds } = getAuthenticationSessionExpiration(absoluteExpiresAt, now, idleTtlSeconds);

        // 第一次登入才以 SET NX 建立隨機 epoch；既有主體沿用目前 epoch。
        const epochKey = keys.epoch(input.principalId);
        const epoch = await initializeEpoch(
            [epochKey],
            [
                nanoid(43),
                absoluteTtlSeconds,
            ],
        );

        // token digest 綁定主體、revision、epoch 與 absolute expiry。
        const generated = generateAuthenticationSessionToken(
            {
                absoluteExpiresAt,
                epoch,
                principalAuthenticationRevision: input.principalAuthenticationRevision,
                principalId: input.principalId,
                principalType,
            },
            tokenHmacKey,
        );

        // Lua 再次確認 epoch 未變，並原子寫入 Session hash 與到期 index。
        const created = await createStoredSession(
            [
                keys.session(generated.selector),
                epochKey,
                keys.index(input.principalId, epoch),
            ],
            [
                epoch,
                absoluteExpiresAt,
                generated.selector,
                now,
                input.ip,
                input.principalAuthenticationRevision,
                input.principalId,
                principalType,
                input.userAgent ?? '',
                generated.validatorDigest,
                ttlSeconds,
                expiresAt,
            ],
        );

        // create 與 revokeAll 競態時拒絕簽發已落入舊 epoch 的 Session。
        if (created !== 1) throw new Error('authentication session epoch changed during creation');

        // 明文 token 只在此回傳一次；Redis 只保存 digest。
        return {
            cookieMaxAgeSeconds: absoluteTtlSeconds,
            session: {
                absoluteExpiresAt,
                epoch,
                id: generated.selector,
                lastActiveAt: now,
                lastActiveIp: input.ip,
                loggedAt: now,
                loginIp: input.ip,
                principalAuthenticationRevision: input.principalAuthenticationRevision,
                principalId: input.principalId,
                principalType,
                userAgent: input.userAgent,
            },
            token: generated.token,
        };
    }

    /** 執行 token、TTL、權威主體與 Redis 狀態的完整認證流程。 */
    async function authenticateParsedToken(
        input: AuthenticateAuthenticationSessionInput,
        parsedToken: ParsedAuthenticationSessionToken,
    ): Promise<undefined | ValidatedAuthenticationSession> {
        // selector 只用來定位 hash，安全性仍由完整 token HMAC 決定。
        const sessionKey = keys.session(parsedToken.selector);
        const storedSession = parseStoredAuthenticationSession(
            await client.hmget(sessionKey, ...storedAuthenticationSessionFields),
            principalType,
        );

        // Redis 資料畸形或 token digest 不符時立即失敗。
        if (
            !storedSession
            || !verifyAuthenticationSessionToken(
                storedSession,
                parsedToken,
                storedSession.validatorDigest,
                tokenHmacKey,
            )
        ) return;

        // 在進行外部主體查詢前先拒絕 absolute/idle 已到期的 Session。
        const now = input.now ?? Date.now();
        if (
            storedSession.absoluteExpiresAt <= now
            || storedSession.lastActiveAt + idleTtlSeconds * 1000 <= now
        ) return;

        // digest 只供內部 Lua 最終確認，不暴露到公開 Session data。
        const { validatorDigest, ...session } = storedSession;
        // 由業務端權威資料確認帳號仍可登入且 revision 未變。
        if (
            !await input.validatePrincipal({
                principalAuthenticationRevision: session.principalAuthenticationRevision,
                principalId: session.principalId,
                principalType: session.principalType,
            })
        ) return;

        // 計算本次成功認證後的 Redis idle TTL，但永不超過 absolute expiry。
        const { expiresAt, ttlSeconds } = getAuthenticationSessionExpiration(
            storedSession.absoluteExpiresAt,
            now,
            idleTtlSeconds,
        );

        // Lua 重新確認 epoch、principal、digest 與 TTL，封閉外部查詢期間的撤銷競態。
        const result = await finalizeAuthentication(
            [
                sessionKey,
                keys.epoch(storedSession.principalId),
                keys.index(storedSession.principalId, storedSession.epoch),
            ],
            [
                storedSession.epoch,
                storedSession.principalId,
                validatorDigest,
                now,
                input.ip,
                ttlSeconds,
                touchIntervalSeconds * 1000,
                expiresAt,
                idleTtlSeconds * 1000,
            ],
        );

        // 0 代表 Session 在驗證期間失效；1 未 touch；2 已更新活動資訊。
        if (result !== 1 && result !== 2) return;

        // 未達 touch interval 時沿用本次初始讀取的 lastActive 資料，避免額外 Redis 讀寫。
        if (result === 1) {
            return {
                session,
                validatorDigest,
            };
        }

        // 實際 touch 後將本次時間與 IP 反映到回傳 Session。
        return {
            session: {
                ...session,
                lastActiveAt: now,
                lastActiveIp: input.ip,
            },
            validatorDigest,
        };
    }

    /** 驗證外部輸入的完整 token，成功時只回傳公開 Session data。 */
    async function authenticate(input: AuthenticateAuthenticationSessionInput) {
        // 格式錯誤的 token 不查詢 Redis。
        const parsedToken = parseAuthenticationSessionToken(input.token);
        if (!parsedToken) return;

        return (await authenticateParsedToken(input, parsedToken))?.session;
    }

    /** 原子撤銷舊 token 並建立新 token，保留原始登入與 absolute expiry。 */
    async function rotate(input: RotateAuthenticationSessionInput) {
        // 先解析 token，避免畸形輸入進入認證流程。
        const parsedToken = parseAuthenticationSessionToken(input.token);
        if (!parsedToken) return;

        // rotate 與 authenticate 共用同一時間，避免兩段流程產生邊界差異。
        const now = input.now ?? Date.now();
        const authenticated = await authenticateParsedToken(
            {
                ...input,
                now,
            },
            parsedToken,
        );

        // 額外確認呼叫端指定的 principalId 與 token 實際歸屬一致。
        if (!authenticated || authenticated.session.principalId !== input.principalId) return;

        // 新 Session TTL 仍受舊 Session 的 absolute expiry 與 idle 策略限制。
        const oldSession = authenticated.session;
        const { expiresAt, ttlSeconds } = getAuthenticationSessionExpiration(
            oldSession.absoluteExpiresAt,
            now,
            idleTtlSeconds,
        );

        // binding 不變但隨機 token 全新產生，舊 token 將無法再次使用。
        const generated = generateAuthenticationSessionToken(oldSession, tokenHmacKey);
        // Lua 驗證舊 digest 後，在同一原子操作中刪舊、建新並更新 index。
        const rotated = await rotateStoredSession(
            [
                keys.session(parsedToken.selector),
                keys.session(generated.selector),
                keys.epoch(input.principalId),
                keys.index(input.principalId, oldSession.epoch),
            ],
            [
                input.principalId,
                authenticated.validatorDigest,
                now,
                generated.selector,
                input.ip,
                input.userAgent ?? oldSession.userAgent ?? '',
                generated.validatorDigest,
                ttlSeconds,
                expiresAt,
                idleTtlSeconds * 1000,
            ],
        );

        // 並行 rotate、revoke 或到期只允許其中一個操作成功。
        if (rotated !== 1) return;

        // Cookie Max-Age 只使用原 absolute expiry 的剩餘秒數，不重新獲得 30 天。
        return {
            cookieMaxAgeSeconds: Math.max(1, Math.ceil((oldSession.absoluteExpiresAt - now) / 1000)),
            session: {
                absoluteExpiresAt: oldSession.absoluteExpiresAt,
                epoch: oldSession.epoch,
                id: generated.selector,
                lastActiveAt: now,
                lastActiveIp: input.ip,
                loggedAt: oldSession.loggedAt,
                loginIp: oldSession.loginIp,
                principalAuthenticationRevision: oldSession.principalAuthenticationRevision,
                principalId: input.principalId,
                principalType,
                userAgent: input.userAgent ?? oldSession.userAgent,
            },
            token: generated.token,
        };
    }

    // 對外合併管理能力、登入能力與 QR Code Login 子介面。
    return {
        ...manager,
        authenticate,
        create,
        qrCodeLogin,
        rotate,
    };
}

/** 取 absolute expiry 與下一個 idle expiry 中較早者，產生 Redis TTL。 */
function getAuthenticationSessionExpiration(absoluteExpiresAt: number, now: number, idleTtlSeconds: number) {
    // 活動只能延長 idle 期限，不能突破 absolute expiry。
    const expiresAt = Math.min(absoluteExpiresAt, now + idleTtlSeconds * 1000);

    return {
        expiresAt,
        // Redis TTL 最低為一秒，並向上取整避免毫秒餘數造成提前到期。
        ttlSeconds: Math.max(1, Math.ceil((expiresAt - now) / 1000)),
    };
}
