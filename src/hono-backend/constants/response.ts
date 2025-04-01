import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const statusCodeToResponseErrorCodeMap = Object.freeze<PartialRecord<ContentfulStatusCode, string>>({
    400: 'badRequest',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'notFound',
    409: 'conflict',
    413: 'payloadTooLarge',
    422: 'validationFailed',
    429: 'tooManyRequests',
    500: 'internalServerError',
    503: 'serviceUnavailable',
    504: 'gatewayTimeout',
});

export const statusCodeToResponseMessageMap = Object.freeze<PartialRecord<ContentfulStatusCode, string>>({
    200: '成功！',
    400: '資料格式錯誤或是非法操作！',
    401: '尚未登入！',
    403: '沒有權限！',
    404: '找不到資料！',
    409: '欄位值重複或是該資料使用中！',
    413: '檔案大小超出限制！',
    422: '資料格式錯誤！',
    429: '請求過於頻繁！',
    500: '系統錯誤！',
    503: '系統維護中！',
    504: '超時！',
});
