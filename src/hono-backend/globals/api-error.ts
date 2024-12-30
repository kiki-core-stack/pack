import { setReadonlyConstantToGlobalThis } from '@kikiutils/node';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { statusCodeToResponseMessageMap } from '../constants/response';

declare global {
    type APIError<D extends object = any> = LocalAPIError<D>;

    const APIError: typeof LocalAPIError;
}

class LocalAPIError<D extends object> extends Error {
    data: D;
    statusCode: ContentfulStatusCode;

    constructor(statusCode?: ContentfulStatusCode, data?: D, message?: string);
    constructor(statusCode?: ContentfulStatusCode, message?: string, data?: D);
    constructor(statusCode: ContentfulStatusCode = 500, arg1: any, arg2?: any) {
        if (typeof arg1 === 'string') {
            const message = arg1;
            arg1 = arg2;
            arg2 = message;
        }

        super(arg2 ?? (statusCodeToResponseMessageMap[statusCode] || '系統錯誤！'));
        this.data = arg1;
        this.statusCode = statusCode;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

setReadonlyConstantToGlobalThis<typeof APIError>('APIError', LocalAPIError);
