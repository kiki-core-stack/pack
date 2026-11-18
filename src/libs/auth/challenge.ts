import { redisClient } from '../../connections/redis';

import {
    generateRandomToken,
    sha256Hex,
} from './_internals/crypto';
import { authRedisKey } from './_internals/redis';

export type AuthChallengeType = 'passwordReset' | 'secondFactor' | 'totpSetup' | 'verificationGrant' | 'webauthn';

// Constants
const authChallengeTtlSeconds: Readonly<Record<AuthChallengeType, number>> = {
    passwordReset: 300,
    secondFactor: 300,
    totpSetup: 600,
    verificationGrant: 120,
    webauthn: 300,
};

// Functions

/**
 * 讀取並刪除挑戰（`GETDEL`）；用於只允許嘗試一次的挑戰。
 */
export async function consumeAuthChallenge<D>(realmName: string, type: AuthChallengeType, id: string) {
    return parseChallenge<D>(await redisClient.getdel(toChallengeKey(realmName, type, id)));
}

/**
 * 建立一次性挑戰並回傳其 ID。ID 本身是秘密，Redis 只以其雜湊作為 key。
 */
export async function createAuthChallenge(realmName: string, type: AuthChallengeType, data: object) {
    const id = generateRandomToken();
    await redisClient.set(
        toChallengeKey(realmName, type, id),
        JSON.stringify(data),
        'EX',
        authChallengeTtlSeconds[type].toString(),
    );

    return id;
}

/**
 * 刪除挑戰；回傳是否確實刪除了一筆。驗證通過後以回傳值作為唯一的放行條件，保證同一個挑戰只能成功一次。
 */
export async function deleteAuthChallenge(realmName: string, type: AuthChallengeType, id: string) {
    return await redisClient.del(toChallengeKey(realmName, type, id)) === 1;
}

/**
 * 讀取挑戰但不刪除；用於驗證失敗可重試的挑戰。
 */
export async function getAuthChallenge<D>(realmName: string, type: AuthChallengeType, id: string) {
    return parseChallenge<D>(await redisClient.get(toChallengeKey(realmName, type, id)));
}

function parseChallenge<D>(value: null | string) {
    return value === null ? undefined : JSON.parse(value) as D;
}

function toChallengeKey(realmName: string, type: AuthChallengeType, id: string) {
    return authRedisKey(realmName, 'challenge', type, sha256Hex(id));
}
