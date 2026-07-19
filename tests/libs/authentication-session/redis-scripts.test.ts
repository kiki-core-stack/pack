import {
    describe,
    it,
} from 'vitest';

import {
    createAuthenticationSessionScript,
    finalizeAuthenticationSessionScript,
    initializeAuthenticationSessionEpochScript,
    revokeAllAuthenticationSessionsScript,
    rotateAuthenticationSessionScript,
} from '../../../src/libs/authentication-session/redis-store/_internals/scripts';

describe.concurrent('redis authentication session scripts', () => {
    it('bounds session indexes and preserves authoritative metadata', ({ expect }) => {
        for (
            const script of [
                createAuthenticationSessionScript,
                finalizeAuthenticationSessionScript,
                rotateAuthenticationSessionScript,
            ]
        ) {
            expect(script).toContain('redis.call(\'ZRANGEBYSCORE\'');
            expect(script).toContain('\'LIMIT\', 0, 256');
            expect(script).toContain('redis.call(\'TTL\'');
        }

        expect(initializeAuthenticationSessionEpochScript).toContain('\'EX\', ARGV[2]');
        expect(initializeAuthenticationSessionEpochScript).toContain('redis.call(\'TTL\', KEYS[1])');
        expect(revokeAllAuthenticationSessionsScript).toContain('redis.call(\'DEL\', KEYS[1])');
        expect(createAuthenticationSessionScript)
            .toContain('\'principalAuthenticationRevision\', ARGV[6]');

        expect(rotateAuthenticationSessionScript)
            .toContain('\'principalAuthenticationRevision\', oldValues[8]');
    });
});
