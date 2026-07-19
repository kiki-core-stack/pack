import { createHash } from 'node:crypto';

/** 所有 Lua runner 都接受已分離的 KEYS 與 ARGV，並回傳呼叫端宣告的 Redis 結果型別。 */
type RedisScriptRunner<TResult> = (keys: string[], args: (number | string)[]) => Promise<TResult>;

/** 建立使用 EVALSHA 執行、遇到 NOSCRIPT 自動載入及重試的 Redis Lua runner。 */
export function createRedisScriptRunner<TResult = unknown>(
    client: Pick<Bun.RedisClient, 'send'>,
    source: string,
): RedisScriptRunner<TResult> {
    // Redis SCRIPT LOAD 與 EVALSHA 使用 Lua source 的 SHA-1 digest 作為識別碼。
    const digest = createHash('sha1').update(source).digest('hex');

    // 同一 runner 的並行 NOSCRIPT 共用一次 SCRIPT LOAD，避免重複傳送完整 script。
    let loading: Promise<unknown> | undefined;

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
                ) as TResult;
            } catch (error) {
                // 只攔截 NOSCRIPT；網路、型別及 Lua runtime 錯誤一律直接拋出。
                if (
                    !(error instanceof Error)
                    || !error.message.includes('NOSCRIPT')
                    || attempt === 2
                ) throw error;

                // 第一個遇到 cache miss 的請求負責載入 script。
                if (loading === undefined) {
                    loading = client
                        .send(
                            'SCRIPT',
                            [
                                'LOAD',
                                source,
                            ],
                        )
                        // 無論成功失敗都清除共享 Promise，讓後續 cache miss 能重試載入。
                        .finally(() => loading = undefined);
                }

                // 其餘並行請求等待同一次載入，再回到迴圈重試 EVALSHA。
                await loading;
            }
        }
    };
}
