import { createKeyedEnhancedRedisStore } from '@kikiutils/shared/storage/enhanced/redis';

import { enhancedRedisStorage } from '../../storages/enhanced/redis';
import type {
    BaseFileData,
    FileData,
} from '../../types/data/file';
import type { EmailOtpCodeType } from '../../types/otp';

export const baseFileData = createKeyedEnhancedRedisStore<BaseFileData>(enhancedRedisStorage)(
    (id: string) => `baseFileData:${id}`,
);

export const emailOtpCode = createKeyedEnhancedRedisStore<string>(enhancedRedisStorage)(
    (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
        let key = `emailOtpCode:${type}:`;
        if (additionalKey) key += `${additionalKey}:`;
        return `${key}${email}`;
    },
);

export const fileData = createKeyedEnhancedRedisStore<FileData>(enhancedRedisStorage)(
    (id: string) => `fileData:${id}`,
);
