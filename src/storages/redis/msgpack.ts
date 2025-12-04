import { createRedisMsgpackStorage } from '@kikiutils/shared/storages/redis/msgpack';
import type { RedisLikeStorage as RedisMsgpackStorage } from '@kikiutils/shared/storages/redis/types';

import { redisClient } from '../../constants/redis';

export const redisMsgpackStorage: RedisMsgpackStorage = createRedisMsgpackStorage({
    delete: (key) => redisClient.del(key),
    getBuffer: (key) => redisClient.getBuffer(key),
    has: (key) => redisClient.exists(key),
    setBuffer: (key, value) => redisClient.set(key, value),
    setBufferEx: (key, ttlSeconds, value) => redisClient.setex(key, ttlSeconds, value),
    ttl: (key) => redisClient.ttl(key),
});
