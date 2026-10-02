import { createHash } from 'node:crypto';

/** 回傳型別由呼叫端宣告，本工具不驗證 Lua 結果；KEYS 與 ARGV 不會被修改。 */
export type RedisScriptRunner<T = unknown> = (keys: readonly string[], args: readonly (number | string)[]) => Promise<
    T
>;

/** 僅需提供原始命令介面；可直接傳入 Bun RedisClient，或下游自行實作 adapter。 */
export interface RedisScriptClient {
    send: (command: string, args: string[]) => Promise<unknown>;
}

/**
 * 建立 EVALSHA runner，遇到 NOSCRIPT 自動 SCRIPT LOAD 後重試。
 * 請重用同一 runner，才能合併其並行載入；不快取執行結果，也不管理 client 生命週期。
 * 重啟／SCRIPT FLUSH／節點切換後可重新載入；非 NOSCRIPT 錯誤直接往外拋。
 */
export function createRedisScriptRunner<T = unknown>(client: RedisScriptClient, source: string): RedisScriptRunner<T> {
    // Redis SCRIPT LOAD 與 EVALSHA 使用 Lua source 的 SHA-1 digest 作為識別碼。
    const digest = createHash('sha1').update(source).digest('hex');

    // 同一 runner 的並行 NOSCRIPT 共用一次 SCRIPT LOAD，避免重複傳送完整 script。
    let loadingPromise: Promise<unknown> | undefined;

    return async (keys, args) => {
        // 最多允許三次 EVALSHA；第三次仍失敗時直接保留原始錯誤。
        for (let attempt = 0; ; attempt += 1) {
            try {
                // Redis 命令格式為 SHA、key count、全部 KEYS、全部 ARGV。
                return await client.send(
                    'EVALSHA',
                    [
                        digest,
                        String(keys.length),
                        ...keys,
                        ...args.map(String),
                    ],
                ) as T;
            } catch (error) {
                // 只攔截 NOSCRIPT；網路、型別及 Lua runtime 錯誤一律直接拋出。
                if (
                    !(error instanceof Error)
                    || !error.message.includes('NOSCRIPT')
                    || attempt === 2
                ) throw error;

                // 第一個遇到 cache miss 的請求負責載入 script。
                if (loadingPromise === undefined) {
                    loadingPromise = client
                        .send(
                            'SCRIPT',
                            [
                                'LOAD',
                                source,
                            ],
                        )
                        // 無論成功失敗都清除共享 Promise，讓後續 cache miss 能重試載入。
                        .finally(() => loadingPromise = undefined);
                }

                // 其餘並行請求等待同一次載入，再回到迴圈重試 EVALSHA。
                await loadingPromise;
            }
        }
    };
}
