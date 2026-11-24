import { randomInt } from 'node:crypto';

import { redisClient } from '../../connections/redis';

import {
    sha256Hex,
    timingSafeEqualStrings,
} from './_internals/crypto';
import { authRedisKey } from './_internals/redis';
import {
    clearAuthAttempts,
    consumeAuthAttempt,
} from './rate-limit';

// Constants
const authCodeTtlSeconds = 300;

// Functions

/**
 * 產生一組六位數的一次性驗證碼並回傳明文，由呼叫端寄出。同一個 `(purpose, subject)` 只有最新的一組有效；
 * 寄送次數以 `(purpose, subject)` 限流，超過即拋出 `AuthRateLimitError`。
 *
 * `subject` 是驗證碼的對象：帳號的操作用 `principalId`；還沒有帳號時（例如註冊時驗證收件位址）用收件位址本身。
 */
export async function createAuthCode(realmName: string, purpose: string, subject: string) {
    await consumeAuthAttempt(realmName, 'codeSendBySubject', toAttemptsKey(purpose, subject));
    const code = randomInt(1_000_000).toString().padStart(6, '0');
    await redisClient.set(
        toCodeKey(realmName, purpose, subject),
        hashCode(realmName, purpose, subject, code),
        'EX',
        authCodeTtlSeconds.toString(),
    );

    return code;
}

function hashCode(realmName: string, purpose: string, subject: string, code: string) {
    return sha256Hex(`${realmName}:${purpose}:${subject}:${code}`);
}

function toAttemptsKey(purpose: string, subject: string) {
    return `${purpose}:${subject}`;
}

// subject 可能含有用戶端輸入的字串，雜湊後再作為 Redis key 以固定長度。
function toCodeKey(realmName: string, purpose: string, subject: string) {
    return authRedisKey(realmName, 'code', purpose, sha256Hex(subject));
}

/**
 * 驗證一次性驗證碼。先計數再比對；通過後以「刪除成功」作為唯一的放行條件，同一組驗證碼只能成功一次。
 * 猜測次數以 `(purpose, subject)` 計數，通過後才歸零；寄出新的一組不會歸零，否則任何人都能靠重新寄送換取更多次猜測。
 * 超過門檻時作廢目前的驗證碼並拋出 `AuthRateLimitError`。
 */
export async function verifyAuthCode(realmName: string, purpose: string, subject: string, code: string) {
    const attemptsKey = toAttemptsKey(purpose, subject);
    const codeKey = toCodeKey(realmName, purpose, subject);
    try {
        await consumeAuthAttempt(realmName, 'codeBySubject', attemptsKey);
    } catch (error) {
        await redisClient.del(codeKey);
        throw error;
    }

    const storedHash = await redisClient.get(codeKey);
    if (storedHash === null || !timingSafeEqualStrings(storedHash, hashCode(realmName, purpose, subject, code))) {
        return false;
    }

    if (await redisClient.del(codeKey) !== 1) return false;
    await clearAuthAttempts(realmName, 'codeBySubject', attemptsKey);
    return true;
}
