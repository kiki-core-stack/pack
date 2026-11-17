import { Buffer } from 'node:buffer';
import {
    createHash,
    randomBytes,
    timingSafeEqual,
} from 'node:crypto';

// Constants
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Functions
export function decodeBase32(value: string) {
    let bits = 0;
    let bitCount = 0;
    const bytes: number[] = [];
    for (const char of value.replace(/=+$/, '').toUpperCase()) {
        const index = base32Alphabet.indexOf(char);
        if (index === -1) throw new Error('Invalid base32 value');
        bits = bits << 5 | index;
        bitCount += 5;
        if (bitCount >= 8) {
            bitCount -= 8;
            bytes.push(bits >>> bitCount & 0xFF);
        }
    }

    return Buffer.from(bytes);
}

export function encodeBase32(buffer: Buffer) {
    let bits = 0;
    let bitCount = 0;
    let output = '';
    for (const byte of buffer) {
        bits = bits << 8 | byte;
        bitCount += 8;
        while (bitCount >= 5) {
            bitCount -= 5;
            output += base32Alphabet[bits >>> bitCount & 31];
        }
    }

    if (bitCount) output += base32Alphabet[bits << 5 - bitCount & 31];
    return output;
}

export function generateRandomToken(byteLength = 32) {
    return randomBytes(byteLength).toString('base64url');
}

export function sha256Hex(value: string) {
    return createHash('sha256').update(value).digest('hex');
}

/**
 * 以固定時間比對兩個字串；長度不同時回傳 false。
 */
export function timingSafeEqualStrings(a: string, b: string) {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}
