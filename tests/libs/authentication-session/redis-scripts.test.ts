import { readFile } from 'node:fs/promises';

import {
    describe,
    it,
} from 'vitest';

import * as redisScripts from '../../../src/redis-scripts';

describe.concurrent('redis authentication session scripts', () => {
    it.for([
        [
            'create',
            redisScripts.authenticationSession.create,
        ],
        [
            'finalize',
            redisScripts.authenticationSession.finalize,
        ],
        [
            'initialize-epoch',
            redisScripts.authenticationSession.initializeEpoch,
        ],
        [
            'revoke-all',
            redisScripts.authenticationSession.revokeAll,
        ],
        [
            'revoke',
            redisScripts.authenticationSession.revoke,
        ],
        [
            'rotate',
            redisScripts.authenticationSession.rotate,
        ],
        [
            'qr-code-login/approve',
            redisScripts.authenticationSession.qrCodeLogin.approve,
        ],
        [
            'qr-code-login/complete',
            redisScripts.authenticationSession.qrCodeLogin.complete,
        ],
        [
            'qr-code-login/create',
            redisScripts.authenticationSession.qrCodeLogin.create,
        ],
    ])(
        'imports %s as Lua source text',
        async ([name, script], { expect }) => {
            const source = await readFile(
                new URL(`../../../src/redis-scripts/authentication-session/${name}.lua`, import.meta.url),
                'utf8',
            );

            expect(script).toBe(source);
        },
    );

    it('bounds session indexes and preserves authoritative metadata', ({ expect }) => {
        for (const script of [
            redisScripts.authenticationSession.create,
            redisScripts.authenticationSession.finalize,
            redisScripts.authenticationSession.rotate,
        ]) {
            expect(script).toMatch(/redis\.call\(\s*['"]ZRANGEBYSCORE['"]/);
            expect(script).toMatch(/['"]LIMIT['"],\s*0,\s*256/);
            expect(script).toMatch(/redis\.call\(\s*['"]TTL['"]/);
        }

        expect(redisScripts.authenticationSession.initializeEpoch).toMatch(/['"]EX['"],\s*ARGV\[2\]/);
        expect(redisScripts.authenticationSession.initializeEpoch).toMatch(/redis\.call\(\s*['"]TTL['"],\s*KEYS\[1\]/);
        expect(redisScripts.authenticationSession.revokeAll).toMatch(/redis\.call\(\s*['"]DEL['"],\s*KEYS\[1\]/);
        expect(redisScripts.authenticationSession.create)
            .toMatch(/['"]principalAuthenticationRevision['"],\s*ARGV\[6\]/);

        expect(redisScripts.authenticationSession.create).not.toMatch(/['"]principalType['"]/);

        expect(redisScripts.authenticationSession.rotate)
            .toMatch(/['"]principalAuthenticationRevision['"],\s*oldValues\[8\]/);

        expect(redisScripts.authenticationSession.rotate).not.toMatch(/['"]principalType['"]/);

        expect(redisScripts.authenticationSession.qrCodeLogin.approve).not.toMatch(/['"]principalType['"]/);
        expect(redisScripts.authenticationSession.qrCodeLogin.complete).not.toMatch(/['"]principalType['"]/);
    });
});
