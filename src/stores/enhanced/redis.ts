// import { createKeyedEnhancedRedisStore } from '@kikiutils/shared/storage/enhanced/redis';

// import { enhancedRedisStorage } from '../../storages/enhanced/redis';
// import type { CachedAdminPermission } from '../../types/admin';
// import type { AdminQrCodeLoginData } from '../../types/data/admin';
// import type { FileDocumentData } from '../../types/data/file';
// import type { EmailOtpCodeType } from '../../types/otp';

// eslint-disable-next-line style/max-len
// export const adminPermission = /* @__PURE__ */ createKeyedEnhancedRedisStore<CachedAdminPermission>(enhancedRedisStorage)(
//     (adminId: string) => `adminPermission:${adminId}`,
// );

// eslint-disable-next-line style/max-len
// export const adminQrCodeLoginData = /* @__PURE__ */ createKeyedEnhancedRedisStore<AdminQrCodeLoginData>(enhancedRedisStorage)(
//     (token: string) => `adminQrCodeLoginData:${token}`,
// );

// export const emailOtpCode = /* @__PURE__ */ createKeyedEnhancedRedisStore<string>(enhancedRedisStorage)(
//     (type: EmailOtpCodeType, email: string, additionalKey?: string) => {
//         let key = `emailOtpCode:${type}:`;
//         if (additionalKey) key += `${additionalKey}:`;
//         return `${key}${email}`;
//     },
// );

// eslint-disable-next-line style/max-len
// export const fileDocumentData = /* @__PURE__ */ createKeyedEnhancedRedisStore<FileDocumentData>(enhancedRedisStorage)(
//     (id: string, additionalKey?: string) => {
//         let key = `fileDocumentData:${id}`;
//         if (additionalKey) key += `:${additionalKey}`;
//         return key;
//     },
// );
