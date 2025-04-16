import { createRedisStoreKeyHandler } from '@/storages/redis/factory';
import type { EmailOtpCodeType } from '@/types/otp';

export const emailOtpCode = createRedisStoreKeyHandler<string>()(
    (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
        let key = `emailOtpCode:${type}:`;
        if (additionalKey) key += `${additionalKey}:`;
        return `${key}${email}`;
    },
);
