import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { statusCodeToApiResponseErrorCodeMap } from '../../constants/response';

export class ApiError<D extends object | undefined = undefined, E extends string = string> extends Error {
    readonly data: D;
    readonly errorCode: E;
    readonly statusCode: ContentfulStatusCode;

    constructor(statusCode: ContentfulStatusCode = 500, errorCode?: E, data?: D, message?: string) {
        super(message?.trim());
        this.data = data as D;
        errorCode = errorCode ?? statusCodeToApiResponseErrorCodeMap[statusCode] as E;
        if (!errorCode) {
            if (statusCode < 400 || statusCode >= 600) errorCode = 'unknownError' as E;
            else errorCode = (statusCode < 500 ? 'unknownClientError' : 'unknownServerError') as E;
        }

        this.errorCode = errorCode;
        this.statusCode = statusCode;
        Error.captureStackTrace?.(this, this.constructor);
    }

    get responseData() {
        return {
            data: this.data,
            errorCode: this.errorCode,
            message: this.message.trim() || undefined,
            success: false,
        };
    }
}
