import { Buffer } from 'node:buffer';
import {
    createHmac,
    randomBytes,
    timingSafeEqual,
} from 'node:crypto';

import type { AuthenticationSessionPrincipalType } from '../../types/data/authentication-session';

// Types
interface GeneratedAuthenticationSessionToken {
    selector: string;
    token: string;
    validatorDigest: string;
}

interface ParsedAuthenticationSessionToken {
    bytes: Uint8Array;
    selector: string;
}

// Constants
const selectorByteLength = 16;
const validatorByteLength = 32;
const tokenByteLength = selectorByteLength + validatorByteLength;
const tokenLength = Math.ceil(tokenByteLength * 4 / 3);
const tokenPattern = new RegExp(`^[\\w-]{${tokenLength}}$`);
// Prevents principal types and token bytes from sharing an ambiguous HMAC input boundary.
const principalTypeSeparator = new Uint8Array([0]);

// Functions
export const generateAuthenticationSessionEpoch = () => randomBytes(32).toString('base64url');

export function generateAuthenticationSessionToken(
    principalType: AuthenticationSessionPrincipalType,
    tokenHmacKey: string | Uint8Array,
): GeneratedAuthenticationSessionToken {
    const bytes = randomBytes(tokenByteLength);

    return {
        selector: bytes.subarray(0, selectorByteLength).toString('base64url'),
        token: bytes.toString('base64url'),
        validatorDigest: getAuthenticationSessionTokenDigestBytes(principalType, bytes, tokenHmacKey)
            .toString('base64url'),
    };
}

export function getAuthenticationSessionTokenDigestBytes(
    principalType: AuthenticationSessionPrincipalType,
    tokenBytes: Uint8Array,
    tokenHmacKey: string | Uint8Array,
) {
    const hasher = typeof Bun !== 'undefined'
        ? new Bun.CryptoHasher('sha256', tokenHmacKey)
        : createHmac('sha256', tokenHmacKey);

    hasher.update(principalType);
    hasher.update(principalTypeSeparator);
    hasher.update(tokenBytes);

    return hasher.digest();
}

export function parseAuthenticationSessionToken(token: string): ParsedAuthenticationSessionToken | undefined {
    if (!tokenPattern.test(token)) return;

    const bytes = Buffer.from(token, 'base64url');

    return {
        bytes,
        selector: bytes.subarray(0, selectorByteLength).toString('base64url'),
    };
}

export function verifyAuthenticationSessionToken(
    principalType: AuthenticationSessionPrincipalType,
    parsedToken: ParsedAuthenticationSessionToken,
    validatorDigest: string,
    tokenHmacKey: string | Uint8Array,
) {
    const actualDigest = getAuthenticationSessionTokenDigestBytes(principalType, parsedToken.bytes, tokenHmacKey);
    const expectedDigest = Buffer.from(validatorDigest, 'base64url');

    return actualDigest.byteLength === expectedDigest.byteLength && timingSafeEqual(actualDigest, expectedDigest);
}
