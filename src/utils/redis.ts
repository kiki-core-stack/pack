import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';

// @ts-expect-error
export const createRedisInstance = (optionsOrUri?: RedisOptions | string) => new Redis(optionsOrUri || process.env.REDIS_URI || 'redis://127.0.0.1:6379');
