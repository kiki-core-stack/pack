import { createEnhancedRedisStorage } from '@kikiutils/shared/storage/enhanced/redis';

import { redisInstance } from '../../constants/redis';

export const enhancedRedisStorage = createEnhancedRedisStorage(redisInstance);
