import { RedisClient } from 'bun';

const { REDIS_URL } = process.env;
export const redisClient = new RedisClient(REDIS_URL || 'redis://127.0.0.1:6379', { maxRetries: 4294967295 });
export const redisSubscriber = await redisClient.duplicate();
