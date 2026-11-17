import { randomBytes } from 'node:crypto';

import {
    encodeBase32,
    sha256Hex,
} from './_internals/crypto';

// Constants
const recoveryCodeCount = 10;

// Functions

/**
 * 產生一組救援碼：10 組、每組 80 位元亂數（16 個 base32 字元），以 `XXXX-XXXX-XXXX-XXXX` 顯示。
 * 回傳的明文只顯示一次；資料庫只存 `hashAuthRecoveryCode` 的結果。
 */
export function generateAuthRecoveryCodes() {
    return Array.from(
        { length: recoveryCodeCount },
        () => encodeBase32(randomBytes(10)).match(/.{4}/g)!.join('-'),
    );
}

/**
 * 救援碼的 SHA-256；比對前先去除分隔符號與空白並轉大寫。
 */
export function hashAuthRecoveryCode(code: string) {
    return sha256Hex(code.replaceAll(/[\s-]/g, '').toUpperCase());
}
