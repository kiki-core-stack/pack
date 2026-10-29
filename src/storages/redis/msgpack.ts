import { Buffer } from 'node:buffer';

import { createRedisScriptRunner } from '@kikiutils/shared/redis/script-runner';
import { createRedisMsgpackStorage } from '@kikiutils/shared/storages/redis/msgpack';
import type { RedisLikeStorage as RedisMsgpackStorage } from '@kikiutils/shared/storages/redis/types';

import { redisClient } from '../../connections/redis';
import * as redisScripts from '../../redis-scripts';

// TODO: Bun RedisClient 提供 getdelBuffer 後改為直接呼叫並刪除 get-and-delete-hex.lua（https://github.com/oven-sh/bun/issues/19576）
const getAndDeleteHex = createRedisScriptRunner<null | string>(redisClient, redisScripts.storage.getAndDeleteHex);

export const redisMsgpackStorage: RedisMsgpackStorage = createRedisMsgpackStorage({
    delete: (key) => redisClient.del(key),
    getBuffer: (key) => redisClient.getBuffer(key),
    async getBufferAndDelete(key) {
        const hex = await getAndDeleteHex([key], []);
        return hex === null ? null : Buffer.from(hex, 'hex');
    },
    has: (key) => redisClient.exists(key),
    setBuffer: (key, value) => redisClient.set(key, value),
    setBufferEx: (key, ttlSeconds, value) => redisClient.setex(key, ttlSeconds, value),
    setBufferExNx(key, ttlSeconds, value) {
        return redisClient.set(key, value, 'EX', ttlSeconds.toString(), 'NX') as Promise<'OK' | null>;
    },
    ttl: (key) => redisClient.ttl(key),
});
