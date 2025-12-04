import { createRedisKeyedStore } from '@kikiutils/shared/storages/redis/keyed-store';

import { redisMsgpackStorage } from '../storages/redis/msgpack';
import type { CachedAdminPermission } from '../types/admin';
import type { AdminQrCodeLoginData } from '../types/data/admin';
import type { FileDocumentData } from '../types/data/file';
import type { EmailOtpCodeType } from '../types/otp';

export const adminPermission = /* @__PURE__ */ createRedisKeyedStore<CachedAdminPermission>(redisMsgpackStorage)(
    (adminId: string) => `adminPermission:${adminId}`,
);

export const adminQrCodeLoginData = /* @__PURE__ */ createRedisKeyedStore<AdminQrCodeLoginData>(redisMsgpackStorage)(
    (token: string) => `adminQrCodeLoginData:${token}`,
);

export const emailOtpCode = /* @__PURE__ */ createRedisKeyedStore<string>(redisMsgpackStorage)(
    (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
        let key = `emailOtpCode:${type}:`;
        if (additionalKey) key += `${additionalKey}:`;
        return `${key}${email}`;
    },
);

export const fileDocumentData = /* @__PURE__ */ createRedisKeyedStore<FileDocumentData>(redisMsgpackStorage)(
    (id: string, additionalKey?: string) => {
        let key = `fileDocumentData:${id}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
