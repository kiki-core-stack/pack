import { createKeyedEnhancedRedisStore } from '@kikiutils/shared/storage/enhanced/redis';

import { enhancedRedisStorage } from '../../storages/enhanced/redis';
import type { FileDocumentData } from '../../types/data/file';
import type { EmailOtpCodeType } from '../../types/otp';

export const emailOtpCode = /* @__PURE__ */ createKeyedEnhancedRedisStore<string>(enhancedRedisStorage)(
    (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
        let key = `emailOtpCode:${type}:`;
        if (additionalKey) key += `${additionalKey}:`;
        return `${key}${email}`;
    },
);

export const fileDocumentData = /* @__PURE__ */ createKeyedEnhancedRedisStore<FileDocumentData>(enhancedRedisStorage)(
    (id: string, additionalKey?: string) => {
        let key = `fileDocumentData:${id}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
