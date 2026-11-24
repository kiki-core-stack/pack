import { Buffer } from 'node:buffer';
import {
    createHmac,
    randomBytes,
} from 'node:crypto';

import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';

import {
    decodeBase32,
    encodeBase32,
    timingSafeEqualStrings,
} from './_internals/crypto';

// Constants
const totpDigits = 6;
const totpPeriodSeconds = 30;

export function generateAuthTotpSecret() {
    return encodeBase32(randomBytes(20));
}

// Functions
/**
 * RFC 4226 的 HOTP：以時間步為計數器，SHA-1、6 位數。
 */
function generateTotpCode(secret: Buffer, step: number) {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step));
    const digest = createHmac('sha1', secret).update(counter).digest();
    const offset = digest[digest.length - 1]! & 0x0F;
    const binary = digest.readUInt32BE(offset) & 0x7FFFFFFF;
    return (binary % 10 ** totpDigits).toString().padStart(totpDigits, '0');
}

export function toAuthTotpUri(secret: string, issuer: string, accountName: string) {
    const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
    const params = new URLSearchParams({
        algorithm: 'SHA1',
        digits: totpDigits.toString(),
        issuer,
        period: totpPeriodSeconds.toString(),
        secret,
    });

    return `otpauth://totp/${label}?${params}`;
}

/**
 * 驗證 TOTP（RFC 6238）：只接受目前與前一個時間步。回傳比對成功的時間步，供呼叫端擋下重放
 * （同一步或更早的驗證碼一律拒絕，並以帶條件的單次更新寫入）；驗證失敗回傳 undefined。
 */
export function verifyAuthTotpCode(secret: string, code: string, now = new EnhancedDate()) {
    if (!/^\d{6}$/.test(code)) return;
    const secretBuffer = decodeBase32(secret);
    const currentStep = Math.floor(now.getUnixTime() / totpPeriodSeconds);
    let matchedStep: number | undefined;
    // 兩個時間步都比對，避免以回應時間洩漏命中的是哪一步。
    for (const step of [
        currentStep,
        currentStep - 1,
    ]) {
        if (timingSafeEqualStrings(generateTotpCode(secretBuffer, step), code)) matchedStep ??= step;
    }

    return matchedStep;
}
