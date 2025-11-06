import { redisClient } from '../../constants/redis';
import { createMsgPackRedisStorage } from '../../libs/storage/redis/msgpack';

export const msgPackRedisStorage = createMsgPackRedisStorage({
    delete: (key) => redisClient.del(key),
    getBuffer: (key) => redisClient.getBuffer(key),
    has: (key) => redisClient.exists(key),
    setBuffer: (key, value) => redisClient.set(key, value),
    setBufferEx: (key, ttlSeconds, value) => redisClient.setex(key, ttlSeconds, value),
    ttl: (key) => redisClient.ttl(key),
});
