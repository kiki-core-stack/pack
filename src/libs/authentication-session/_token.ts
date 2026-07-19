import { Buffer } from 'node:buffer';
import {
    createHmac,
    randomBytes,
    timingSafeEqual,
} from 'node:crypto';

import type { AuthenticationSessionData } from '../../types/data/authentication-session';

// Types
type AuthenticationSessionTokenBindingData = Pick<
    AuthenticationSessionData,
    | 'absoluteExpiresAt'
    | 'epoch'
    | 'principalAuthenticationRevision'
    | 'principalId'
    | 'principalType'
>;

interface GeneratedAuthenticationSessionToken {
    selector: string;
    token: string;
    validatorDigest: string;
}

export interface ParsedAuthenticationSessionToken {
    bytes: Uint8Array;
    selector: string;
}

// Constants
export const tokenSelectorByteLength = 16;
export const tokenValidatorByteLength = 32;
const tokenByteLength = tokenSelectorByteLength + tokenValidatorByteLength;
const tokenLength = Math.ceil(tokenByteLength * 4 / 3);
const tokenPattern = new RegExp(`^[\\w-]{${tokenLength}}$`);

// Functions
export function generateAuthenticationSessionToken(
    binding: AuthenticationSessionTokenBindingData,
    tokenHmacKey: string | Uint8Array,
): GeneratedAuthenticationSessionToken {
    const bytes = randomBytes(tokenByteLength);

    return {
        selector: bytes.subarray(0, tokenSelectorByteLength).toString('base64url'),
        token: bytes.toString('base64url'),
        validatorDigest: getAuthenticationSessionTokenDigestBytes(binding, bytes, tokenHmacKey)
            .toString('base64url'),
    };
}

function getAuthenticationSessionTokenDigestBytes(
    binding: AuthenticationSessionTokenBindingData,
    tokenBytes: Uint8Array,
    tokenHmacKey: string | Uint8Array,
) {
    const hasher = typeof Bun !== 'undefined'
        ? new Bun.CryptoHasher('sha256', tokenHmacKey)
        : createHmac('sha256', tokenHmacKey);

    hasher.update(JSON.stringify([
        binding.principalType,
        binding.principalId,
        binding.principalAuthenticationRevision,
        binding.epoch,
        binding.absoluteExpiresAt,
    ]));

    hasher.update(tokenBytes);

    return hasher.digest();
}

export function parseAuthenticationSessionToken(token: string): ParsedAuthenticationSessionToken | undefined {
    if (!tokenPattern.test(token)) return;

    const bytes = Buffer.from(token, 'base64url');

    return {
        bytes,
        selector: bytes.subarray(0, tokenSelectorByteLength).toString('base64url'),
    };
}

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

export function verifyAuthenticationSessionTokenDigest(actualDigest: Uint8Array, validatorDigest: string) {
    const expectedDigest = Buffer.from(validatorDigest, 'base64url');

    return actualDigest.byteLength === expectedDigest.byteLength && timingSafeEqual(actualDigest, expectedDigest);
}
