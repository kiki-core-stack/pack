import { Redis } from 'ioredis';

export const redisInstance = new Redis(
    process.env.REDIS_URL || 'redis://127.0.0.1:6379?protocol=resp3',
    { lazyConnect: true },
);
