import { Redis } from 'ioredis';

export const redisInstance = new Redis(process.env.REDIS_URI || 'redis://127.0.0.1:6379');
