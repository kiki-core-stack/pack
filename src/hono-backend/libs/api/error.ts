import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { statusCodeToResponseMessageMap } from '../../constants/response';

export class ApiError<
    D extends object | undefined = undefined,
    E extends string | undefined = undefined,
> extends Error {
    readonly data: D;
    readonly errorCode: E;
    readonly statusCode: ContentfulStatusCode;

    constructor(statusCode: ContentfulStatusCode, message?: string, errorCode?: E, data?: D) {
        super(message ?? statusCodeToResponseMessageMap[statusCode] ?? '系統錯誤！');
        this.data = data as D;
        this.errorCode = errorCode as E;
        this.statusCode = statusCode;
        Error.captureStackTrace?.(this, this.constructor);
    }
}
