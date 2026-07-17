import { Buffer } from 'node:buffer';

import {
    describe,
    it,
} from 'vitest';

import {
    generateAuthenticationSessionToken,
    parseAuthenticationSessionToken,
    verifyAuthenticationSessionToken,
} from '../../../src/libs/authentication-session/_token';

// Constants
const tokenHmacKey = 'a-secure-test-only-token-hmac-key-with-more-than-32-bytes';
const tokenBinding = {
    absoluteExpiresAt: 20_000,
    epoch: 'epoch',
    principalAuthenticationRevision: 3,
    principalId: 'admin-id',
    principalType: 'admin',
} as const;

// Tests
describe.concurrent('authentication session token', () => {
    it('generates a fixed-length opaque selector and token', ({ expect }) => {
        const generated = generateAuthenticationSessionToken(tokenBinding, tokenHmacKey);
        const parsed = parseAuthenticationSessionToken(generated.token);

        expect(Buffer.from(generated.selector, 'base64url')).toHaveLength(16);
        expect(Buffer.from(generated.token, 'base64url')).toHaveLength(48);
        expect(parsed?.selector).toBe(generated.selector);
        expect(
            parsed && verifyAuthenticationSessionToken(
                tokenBinding,
                parsed,
                generated.validatorDigest,
                tokenHmacKey,
            ),
        ).toBe(true);
    });

    it('rejects malformed and tampered tokens', ({ expect }) => {
        const generated = generateAuthenticationSessionToken(tokenBinding, tokenHmacKey);
        const tampered = `${generated.token.slice(0, -1)}${generated.token.endsWith('A') ? 'B' : 'A'}`;

        expect(parseAuthenticationSessionToken('short')).toBeUndefined();
        expect(parseAuthenticationSessionToken(`${generated.token}A`)).toBeUndefined();
        expect(
            verifyAuthenticationSessionToken(
                tokenBinding,
                parseAuthenticationSessionToken(tampered)!,
                generated.validatorDigest,
                tokenHmacKey,
            ),
        ).toBe(false);
    });

    it('binds immutable session authorization metadata to the token digest', ({ expect }) => {
        const generated = generateAuthenticationSessionToken(tokenBinding, tokenHmacKey);
        const parsed = parseAuthenticationSessionToken(generated.token)!;

        for (
            const changedBinding of [
                {
                    ...tokenBinding,
                    absoluteExpiresAt: tokenBinding.absoluteExpiresAt + 1,
                },
                {
                    ...tokenBinding,
                    epoch: 'another-epoch',
                },
                {
                    ...tokenBinding,
                    principalAuthenticationRevision: 4,
                },
                {
                    ...tokenBinding,
                    principalId: 'another-admin',
                },
            ]
        ) {
            expect(
                verifyAuthenticationSessionToken(
                    changedBinding,
                    parsed,
                    generated.validatorDigest,
                    tokenHmacKey,
                ),
            ).toBe(false);
        }
    });
});
