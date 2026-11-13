import {
    duplicateKeyErrorDataSchema,
    validationFailedErrorDataSchema,
} from '../../schemas/api';
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
        message: {
            'en': 'Invalid request',
            'zh-TW': '請求無效',
        },
        status: 400,
    },
    conflict: {
        message: {
            'en': 'The data has changed or is in use; refresh and try again',
            'zh-TW': '資料狀態已變更或使用中，請重新整理後再試',
        },
        status: 409,
    },
    duplicateKey: {
        errorData: duplicateKeyErrorDataSchema,
        message: {
            'en': 'Duplicate data',
            'zh-TW': '資料重複',
        },
        status: 409,
    },
    forbidden: {
        message: {
            'en': 'Permission denied',
            'zh-TW': '沒有權限',
        },
        status: 403,
    },
    gatewayTimeout: {
        message: {
            'en': 'Upstream service timed out',
            'zh-TW': '上游服務逾時',
        },
        status: 504,
    },
    gone: {
        message: {
            'en': 'The data has expired or is no longer available',
            'zh-TW': '資料已過期或不再可用',
        },
        status: 410,
    },
    internalServerError: {
        message: {
            'en': 'Internal server error',
            'zh-TW': '系統錯誤',
        },
        status: 500,
    },
    notFound: {
        message: {
            'en': 'Not found',
            'zh-TW': '找不到資料',
        },
        status: 404,
    },
    payloadTooLarge: {
        message: {
            'en': 'Request payload too large',
            'zh-TW': '請求內容過大',
        },
        status: 413,
    },
    serviceUnavailable: {
        message: {
            'en': 'Service temporarily unavailable',
            'zh-TW': '服務暫時無法使用',
        },
        status: 503,
    },
    tooManyRequests: {
        message: {
            'en': 'Too many requests',
            'zh-TW': '請求過於頻繁',
        },
        status: 429,
    },
    unauthorized: {
        message: {
            'en': 'Not logged in',
            'zh-TW': '尚未登入',
        },
        status: 401,
    },
    validationFailed: {
        errorData: validationFailedErrorDataSchema,
        message: {
            'en': 'Invalid data',
            'zh-TW': '資料格式錯誤',
        },
        status: 400,
    },
});
