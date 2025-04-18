import { createRedisStoreKeyHandler } from '@/libs/storages/redis/factory';
import { redisStorage } from '@/storages/redis';
import type {
    BaseFileData,
    FileData,
} from '@/types/data/file';
import type { EmailOtpCodeType } from '@/types/otp';

export const baseFileData = createRedisStoreKeyHandler<BaseFileData>(redisStorage)(
    (id: string) => `baseFileData:${id}`,
);

export const emailOtpCode = createRedisStoreKeyHandler<string>(redisStorage)(
    (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
        let key = `emailOtpCode:${type}:`;
        if (additionalKey) key += `${additionalKey}:`;
        return `${key}${email}`;
    },
);

export const fileData = createRedisStoreKeyHandler<FileData>(redisStorage)(
    (id: string) => `fileData:${id}`,
);
