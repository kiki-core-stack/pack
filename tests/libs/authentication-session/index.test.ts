import { Buffer } from 'node:buffer';

import {
    describe,
    it,
} from 'vitest';

import {
    generateAuthenticationSessionEpoch,
    generateAuthenticationSessionToken,
    parseAuthenticationSessionToken,
    verifyAuthenticationSessionToken,
} from '../../../src/libs/authentication-session';

const tokenHmacKey = 'a-secure-test-only-token-hmac-key-with-more-than-32-bytes';

describe.concurrent('authentication session token', () => {
    it('generates a fixed-length opaque selector and token', ({ expect }) => {
        const generated = generateAuthenticationSessionToken('admin', tokenHmacKey);
        const parsed = parseAuthenticationSessionToken(generated.token);

        expect(Buffer.from(generated.selector, 'base64url')).toHaveLength(16);
        expect(Buffer.from(generated.token, 'base64url')).toHaveLength(48);
        expect(parsed?.selector).toBe(generated.selector);
        expect(parsed && verifyAuthenticationSessionToken('admin', parsed, generated.validatorDigest, tokenHmacKey))
            .toBe(true);
    });

    it('rejects malformed and tampered tokens', ({ expect }) => {
        const generated = generateAuthenticationSessionToken('admin', tokenHmacKey);
        const tampered = `${generated.token.slice(0, -1)}${generated.token.endsWith('A') ? 'B' : 'A'}`;

        expect(parseAuthenticationSessionToken('short')).toBeUndefined();
        expect(parseAuthenticationSessionToken(`${generated.token}A`)).toBeUndefined();
        expect(
            verifyAuthenticationSessionToken(
                'admin',
                parseAuthenticationSessionToken(tampered)!,
                generated.validatorDigest,
                tokenHmacKey,
            ),
        ).toBe(false);
    });

    it('generates independent random epochs', ({ expect }) => {
        const first = generateAuthenticationSessionEpoch();
        const second = generateAuthenticationSessionEpoch();

        expect(Buffer.from(first, 'base64url')).toHaveLength(32);
        expect(second).not.toBe(first);
    });
});
