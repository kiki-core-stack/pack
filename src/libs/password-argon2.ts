import {
    availableParallelism,
    totalmem,
} from 'node:os';

import { Semaphore } from 'es-toolkit';

// Constants/Variables

/**
 * RFC 9106 低記憶體建議的 64 MiB、3 次迭代；Bun 僅支援 parallelism 1。
 * 調整參數後，舊雜湊仍可驗證，並由 isArgon2PasswordHashOutdated 判斷是否需要重新雜湊。
 */
const argon2HashOptions = {
    algorithm: 'argon2id',
    memoryCost: 64 * 1024,
    timeCost: 3,
} as const satisfies Bun.Password.Argon2Algorithm;

/**
 * 每個雜湊／驗證約佔用 memoryCost 的記憶體，同時執行數以可用記憶體的 1/8 與核心數取較小值（至少 1），
 * 避免大量並行登入耗盡記憶體；超過上限的請求排隊等待。
 * 可用記憶體取主機與 cgroup 限制較小者；核心數未考慮 CPU quota。
 */
const availableMemoryBytes = Math.min(totalmem(), process.constrainedMemory() || Infinity);
const argon2MemoryCostBytes = argon2HashOptions.memoryCost * 1024;
const argon2Semaphore = new Semaphore(
    Math.max(1, Math.min(availableParallelism(), Math.floor(availableMemoryBytes / 8 / argon2MemoryCostBytes))),
);

const argon2HashParamsPattern = /^\$argon2id\$v=\d+\$m=(\d+),t=(\d+),p=\d+\$/;
let missingPasswordHash: Promise<string> | undefined;

// Functions
async function getMissingPasswordHash() {
    missingPasswordHash ??= hashPasswordWithArgon2('missing-password').catch((error) => {
        missingPasswordHash = undefined;
        throw error;
    });

    return await missingPasswordHash;
}

export async function hashPasswordWithArgon2(password: string) {
    // Bun 會把非字串值轉成字串雜湊（例如 null 變成 "null"），必須在此擋下。
    if (typeof password !== 'string') throw new TypeError('Password must be a string');
    return await withArgon2Semaphore(async () => await Bun.password.hash(password, argon2HashOptions));
}

/**
 * 雜湊不是以目前參數產生的 argon2id 雜湊時回傳 true。
 */
export function isArgon2PasswordHashOutdated(hashed: string) {
    const match = argon2HashParamsPattern.exec(hashed);
    return (
        !match
        || Number(match[1]) !== argon2HashOptions.memoryCost
        || Number(match[2]) !== argon2HashOptions.timeCost
    );
}

/**
 * hashed 為 undefined（例如帳號不存在）時，改以相同參數的假雜湊驗證後回傳 false，讓回應時間與帳號存在時一致。
 * 雜湊格式錯誤時回傳 false。
 */
export async function verifyPasswordWithArgon2(hashed: string | undefined, input: string) {
    const targetHash = hashed ?? await getMissingPasswordHash();
    const verified = await withArgon2Semaphore(
        async () => await Bun.password.verify(input, targetHash, argon2HashOptions.algorithm).catch(() => false),
    );

    return hashed !== undefined && verified;
}

async function withArgon2Semaphore<T>(operation: () => Promise<T>) {
    await argon2Semaphore.acquire();
    try {
        return await operation();
    } finally {
        argon2Semaphore.release();
    }
}
