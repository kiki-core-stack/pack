import { Buffer } from 'node:buffer';

import { createRedisScriptRunner } from '@kikiutils/shared/redis/script-runner';
import { createRedisMsgpackStorage } from '@kikiutils/shared/storages/redis/msgpack';
import type { RedisLikeStorage as RedisMsgpackStorage } from '@kikiutils/shared/storages/redis/types';

import { redisClient } from '../../connections/redis';
import * as redisScripts from '../../redis-scripts';

// TODO: Bun RedisClient 提供 getdelBuffer 後改為直接呼叫並刪除 get-and-delete-hex.lua（https://github.com/oven-sh/bun/issues/19576）
const getAndDeleteHex = createRedisScriptRunner<null | string>(redisClient, redisScripts.storage.getAndDeleteHex);

export const redisMsgpackStorage: RedisMsgpackStorage = createRedisMsgpackStorage({
    delete: async (key) => await redisClient.del(key),
    getBuffer: async (key) => await redisClient.getBuffer(key),
    async getBufferAndDelete(key) {
        const hex = await getAndDeleteHex([key], []);
        return hex === null ? null : Buffer.from(hex, 'hex');
    },
    has: async (key) => await redisClient.exists(key),
    setBuffer: async (key, value) => await redisClient.set(key, value),
    setBufferEx: async (key, ttlSeconds, value) => await redisClient.setex(key, ttlSeconds, value),
    async setBufferExNx(key, ttlSeconds, value) {
        return await (redisClient.set(key, value, 'EX', ttlSeconds.toString(), 'NX') as Promise<'OK' | null>);
    },
    ttl: async (key) => await redisClient.ttl(key),
});
