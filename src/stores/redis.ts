import { createRedisStoreKeyHandler } from '@/libs/storages/redis/factory';
import { redisStorage } from '@/storages/redis';
import type { EmailOtpCodeType } from '@/types/otp';

export const emailOtpCode = createRedisStoreKeyHandler<string>(redisStorage)(
    (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
        let key = `emailOtpCode:${type}:`;
        if (additionalKey) key += `${additionalKey}:`;
        return `${key}${email}`;
    },
);
