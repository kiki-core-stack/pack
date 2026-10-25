import { createRedisScriptRunner } from '@kikiutils/shared/redis/script-runner';
import { nanoid } from 'nanoid';
import type { Promisable } from 'type-fest';

import { redisClient } from '../../connections/redis';
import * as redisScripts from '../../redis-scripts';
import { logger } from '../_logger';

export type RedisLockExecutionResult<T> =
  | { acquired: false }
  | {
      acquired: true;
      value: T;
  };

export interface RedisLockContext {
    /** 檢查目前 key 是否仍屬於此鎖；不保證後續操作期間仍持有鎖。 */
    isOwned: () => Promise<boolean>;
    readonly key: string;
    readonly token: string;
}

// Functions
const releaseRedisLockIfOwned = createRedisScriptRunner<number>(redisClient, redisScripts.lock.releaseIfOwned);

/**
 * 嘗試取得固定期限佔位；不主動釋放，等待 TTL 到期。
 * key 由呼叫端提供完整名稱，TTL 單位為毫秒；Redis 錯誤直接拋出。
 */
export async function tryClaimRedisKey(key: string, ttlMilliseconds: number): Promise<boolean> {
    return !!await redisClient.set(key, '1', 'PX', ttlMilliseconds.toString(), 'NX');
}

/**
 * 取得鎖後執行 callback，完成或拋錯後原子釋放自己的鎖。
 * key 由呼叫端提供完整名稱，TTL 單位為毫秒；未取得鎖時不執行 callback。
 * 不自動續期或取消 callback；工作超過 TTL 後可能與其他執行者並行。
 * 取得鎖或 callback 的錯誤直接拋出；釋放失敗只記錄錯誤並等待 TTL 到期。
 */
export async function tryWithRedisLock<T>(
    key: string,
    ttlMilliseconds: number,
    callback: (lock: RedisLockContext) => Promisable<T>,
): Promise<RedisLockExecutionResult<T>> {
    const token = nanoid();
    const acquired = await redisClient.set(key, token, 'PX', ttlMilliseconds.toString(), 'NX');
    if (!acquired) return { acquired: false };

    try {
        const value = await callback({
            isOwned: async () => await redisClient.get(key) === token,
            key,
            token,
        });

        return {
            acquired: true,
            value,
        };
    } finally {
        await releaseRedisLockIfOwned([key], [token]).catch((error) => {
            logger.error(
                'Failed to release Redis lock',
                {
                    error,
                    key,
                },
            );
        });
    }
}
