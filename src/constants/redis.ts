import { RedisClient } from 'bun';

export const redisClient = new RedisClient(
    process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    { maxRetries: 4294967295 },
);
