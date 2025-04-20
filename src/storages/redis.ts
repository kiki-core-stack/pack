import { createRedisStorage } from '../libs/storages/redis/create';

export const redisStorage = createRedisStorage(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
