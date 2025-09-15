import { createEnhancedRedisStorage } from '@kikiutils/shared/storage/enhanced/redis';

export const enhancedRedisStorage = createEnhancedRedisStorage(
    process.env.REDIS_URL || 'redis://127.0.0.1:6379?protocol=resp3',
);
