import { createKeyedRedisStore } from '../libs/storage/redis/keyed-store';
import { cborRedisStorage } from '../storages/redis/cbor';
import type { CachedAdminPermission } from '../types/admin';
import type { AdminQrCodeLoginData } from '../types/data/admin';
import type { FileDocumentData } from '../types/data/file';
import type { EmailOtpCodeType } from '../types/otp';

export const adminPermission = /* @__PURE__ */ createKeyedRedisStore<CachedAdminPermission>(cborRedisStorage)(
    (adminId: string) => `adminPermission:${adminId}`,
);

export const adminQrCodeLoginData = /* @__PURE__ */ createKeyedRedisStore<AdminQrCodeLoginData>(cborRedisStorage)(
    (token: string) => `adminQrCodeLoginData:${token}`,
);

export const emailOtpCode = /* @__PURE__ */ createKeyedRedisStore<string>(cborRedisStorage)(
    (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
        let key = `emailOtpCode:${type}:`;
        if (additionalKey) key += `${additionalKey}:`;
        return `${key}${email}`;
    },
);

export const fileDocumentData = /* @__PURE__ */ createKeyedRedisStore<FileDocumentData>(cborRedisStorage)(
    (id: string, additionalKey?: string) => {
        let key = `fileDocumentData:${id}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
