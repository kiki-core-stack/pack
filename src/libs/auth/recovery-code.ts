import { randomBytes } from 'node:crypto';

import {
    encodeBase32,
    sha256Hex,
} from './_internals/crypto';

// Constants
const recoveryCodeCount = 10;

// Functions

/**
 * 回傳的明文只顯示一次；資料庫只存 `hashAuthRecoveryCode` 的結果。
 */
export function generateAuthRecoveryCodes() {
    return Array.from(
        { length: recoveryCodeCount },
        () => encodeBase32(randomBytes(10)).match(/.{4}/g)!.join('-'),
    );
}

export function hashAuthRecoveryCode(code: string) {
    return sha256Hex(code.replaceAll(/[\s-]/g, '').toUpperCase());
}
