import Redis from 'ioredis';
import { env } from 'node:process';

export const redisInstance = new Redis(env.REDIS_URI || 'redis://127.0.0.1:6379');
