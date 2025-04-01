import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { statusCodeToResponseMessageMap } from '../../constants/response';

export class ApiError<
    D extends object | undefined = undefined,
    E extends string | undefined = undefined,
> extends Error {
    data: D;
    errorCode: E;
    statusCode: ContentfulStatusCode;

    constructor();
    constructor(statusCode: ContentfulStatusCode);
    constructor(statusCode: ContentfulStatusCode, data: D, message?: string, errorCode?: E);
    constructor(statusCode: ContentfulStatusCode, message?: string, data?: D, errorCode?: E);
    constructor(statusCode: ContentfulStatusCode = 500, arg1?: any, arg2?: any, errorCode?: any) {
        if (typeof arg1 === 'string') {
            const message = arg1;
            arg1 = arg2;
            arg2 = message;
        }

        super(arg2 ?? (statusCodeToResponseMessageMap[statusCode] || '系統錯誤！'));
        this.data = arg1;
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        Error.captureStackTrace?.(this, this.constructor);
    }
}
