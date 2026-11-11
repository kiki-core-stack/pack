import * as z from 'zod';

import { defineApiErrors } from '../libs/api/error';

export const {
    badRequest,
    conflict,
    duplicateKey,
    forbidden,
    gatewayTimeout,
    gone,
    internalServerError,
    notFound,
    payloadTooLarge,
    serviceUnavailable,
    tooManyRequests,
    unauthorized,
    validationFailed,
} = defineApiErrors({
    badRequest: {
        description: '請求無效',
        status: 400,
    },
    conflict: {
        description: '與資源目前的狀態衝突',
        status: 409,
    },
    duplicateKey: {
        data: z.object({ fields: z.array(z.string()) }),
        description: '資料重複，`fields` 為重複的欄位',
        status: 409,
    },
    forbidden: {
        description: '權限不足',
        status: 403,
    },
    gatewayTimeout: {
        description: '上游服務逾時',
        status: 504,
    },
    gone: {
        description: '資源已失效或不再可用',
        status: 410,
    },
    internalServerError: {
        description: '伺服器內部錯誤',
        status: 500,
    },
    notFound: {
        description: '找不到資源',
        status: 404,
    },
    payloadTooLarge: {
        description: '請求內容過大',
        status: 413,
    },
    serviceUnavailable: {
        description: '服務暫時無法使用',
        status: 503,
    },
    tooManyRequests: {
        description: '請求過於頻繁',
        status: 429,
    },
    unauthorized: {
        description: '未登入',
        status: 401,
    },
    validationFailed: {
        data: z.object({
            issues: z.array(z.object({
                code: z.string().optional(),
                message: z.string(),
                params: z.record(z.string(), z.unknown()).optional(),
                path: z.array(z.union([
                    z.number(),
                    z.string(),
                ])),
            })),
        }),
        description: '請求資料驗證失敗，`issues` 為各欄位的錯誤',
        status: 400,
    },
});
