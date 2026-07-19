import { createHash } from 'node:crypto';

// Types
type RedisScriptRunner<TResult> = (keys: string[], args: (number | string)[]) => Promise<TResult>;

// Functions
export function createRedisScriptRunner<TResult = unknown>(
    client: Pick<Bun.RedisClient, 'send'>,
    source: string,
): RedisScriptRunner<TResult> {
    const digest = createHash('sha1').update(source).digest('hex');
    let loading: Promise<unknown> | undefined;

    return async (keys, args) => {
        for (let attempt = 0; ; attempt += 1) {
            try {
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
                if (
                    !(error instanceof Error)
                    || !error.message.includes('NOSCRIPT')
                    || attempt === 2
                ) throw error;

                if (loading === undefined) {
                    loading = client
                        .send(
                            'SCRIPT',
                            [
                                'LOAD',
                                source,
                            ],
                        )
                        .finally(() => loading = undefined);
                }

                await loading;
            }
        }
    };
}
