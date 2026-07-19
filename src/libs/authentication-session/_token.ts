import { Buffer } from 'node:buffer';
import {
    createHmac,
    randomBytes,
    timingSafeEqual,
} from 'node:crypto';

import type { AuthenticationSessionData } from '../../types/data/authentication-session';

/** Token digest 必須綁定這些不可變的工作階段安全欄位，避免 token 被搬到其他主體或世代使用。 */
type AuthenticationSessionTokenBindingData = Pick<
    AuthenticationSessionData,
    | 'absoluteExpiresAt'
    | 'epoch'
    | 'principalAuthenticationRevision'
    | 'principalId'
    | 'principalType'
>;

interface GeneratedAuthenticationSessionToken {
    /** selector 可公開作為 Redis key 的隨機索引，不具備單獨認證能力。 */
    selector: string;

    /** 完整 token 同時包含 selector 與秘密 validator。 */
    token: string;

    /** Redis 僅保存 HMAC digest，不保存可直接登入的完整 token。 */
    validatorDigest: string;
}

/** 完整 token 通過格式檢查後的二進位資料及 selector。 */
export interface ParsedAuthenticationSessionToken {
    bytes: Uint8Array;
    selector: string;
}

/** selector 使用 128-bit 隨機值，兼顧不可預測性與 Redis key 長度。 */
export const tokenSelectorByteLength = 16;

/** validator 使用 256-bit 隨機值，作為真正的 bearer credential。 */
export const tokenValidatorByteLength = 32;

/** 完整 token 是 selector 與 validator 的直接串接。 */
const tokenByteLength = tokenSelectorByteLength + tokenValidatorByteLength;

/** base64url 不含 padding，因此長度為位元組數乘以 4/3 後向上取整。 */
const tokenLength = Math.ceil(tokenByteLength * 4 / 3);

/** 先以固定長度及 base64url 字元集拒絕格式不正確的輸入。 */
const tokenPattern = new RegExp(`^[\\w-]{${tokenLength}}$`);

/** 產生新的 opaque token、Redis selector 與綁定工作階段資料的 HMAC digest。 */
export function generateAuthenticationSessionToken(
    binding: AuthenticationSessionTokenBindingData,
    tokenHmacKey: string | Uint8Array,
): GeneratedAuthenticationSessionToken {
    // 一次產生完整隨機材料，避免 selector 與 validator 使用不同生成流程。
    const bytes = randomBytes(tokenByteLength);

    return {
        // selector 只取前 16 bytes，作為 Redis 定位索引。
        selector: bytes.subarray(0, tokenSelectorByteLength).toString('base64url'),
        // 完整 token 僅交給客戶端，不寫入 Redis。
        token: bytes.toString('base64url'),
        // 將 token 與工作階段安全欄位共同簽入 digest。
        validatorDigest: getAuthenticationSessionTokenDigestBytes(binding, bytes, tokenHmacKey)
            .toString('base64url'),
    };
}

/** 計算綁定工作階段安全欄位與完整 token 的 HMAC-SHA256。 */
function getAuthenticationSessionTokenDigestBytes(
    binding: AuthenticationSessionTokenBindingData,
    tokenBytes: Uint8Array,
    tokenHmacKey: string | Uint8Array,
) {
    // Bun runtime 使用原生 CryptoHasher；其他相容環境退回 Node HMAC。
    const hasher = typeof Bun !== 'undefined'
        ? new Bun.CryptoHasher('sha256', tokenHmacKey)
        : createHmac('sha256', tokenHmacKey);

    // 使用固定欄位順序序列化 domain binding，避免不同語意資料產生相同輸入。
    hasher.update(JSON.stringify([
        binding.principalType,
        binding.principalId,
        binding.principalAuthenticationRevision,
        binding.epoch,
        binding.absoluteExpiresAt,
    ]));

    // 最後加入完整 bearer token 的原始 bytes。
    hasher.update(tokenBytes);

    // 回傳 bytes，讓呼叫端依儲存或比對用途決定是否編碼。
    return hasher.digest();
}

/** 驗證 token 外觀並拆出 Redis selector；不在此驗證密碼學真偽。 */
export function parseAuthenticationSessionToken(token: string): ParsedAuthenticationSessionToken | undefined {
    // 固定格式檢查可避免無效輸入進入 Redis 查詢及解碼流程。
    if (!tokenPattern.test(token)) return;

    // 格式通過後只解碼一次，後續 HMAC 直接使用同一份 bytes。
    const bytes = Buffer.from(token, 'base64url');

    return {
        bytes,
        selector: bytes.subarray(0, tokenSelectorByteLength).toString('base64url'),
    };
}

/** 重新計算 token digest，並與 Redis 保存值進行固定時間比對。 */
export function verifyAuthenticationSessionToken(
    binding: AuthenticationSessionTokenBindingData,
    parsedToken: ParsedAuthenticationSessionToken,
    validatorDigest: string,
    tokenHmacKey: string | Uint8Array,
) {
    return verifyAuthenticationSessionTokenDigest(
        getAuthenticationSessionTokenDigestBytes(binding, parsedToken.bytes, tokenHmacKey),
        validatorDigest,
    );
}

/** 比較實際 digest 與 base64url 儲存值，長度不同時直接拒絕。 */
export function verifyAuthenticationSessionTokenDigest(actualDigest: Uint8Array, validatorDigest: string) {
    // Redis wire format 是字串，因此只在比對邊界解碼一次。
    const expectedDigest = Buffer.from(validatorDigest, 'base64url');

    // timingSafeEqual 要求等長；先比長度可避免例外並拒絕畸形資料。
    return actualDigest.byteLength === expectedDigest.byteLength && timingSafeEqual(actualDigest, expectedDigest);
}
