import type { ContentfulStatusCode } from 'hono/utils/http-status';

import {
    statusCodeToResponseErrorCodeMap,
    statusCodeToResponseMessageMap,
} from '../../constants/response';

export class ApiError<D extends object | undefined = undefined, E extends string = string> extends Error {
    readonly data: D;
    readonly errorCode: E;
    readonly statusCode: ContentfulStatusCode;

    constructor(statusCode: ContentfulStatusCode = 500, message?: string, errorCode?: E, data?: D) {
        super(message ?? statusCodeToResponseMessageMap[statusCode] ?? (statusCode < 500 ? '未知客戶端錯誤！' : '未知系統錯誤！'));
        this.data = data as D;
        this.errorCode = (
            errorCode
            ?? statusCodeToResponseErrorCodeMap[statusCode]
            ?? (statusCode < 500 ? 'unknownClientError' : 'unknownServerError')
        ) as E;

        this.statusCode = statusCode;
        Error.captureStackTrace?.(this, this.constructor);
    }
}
