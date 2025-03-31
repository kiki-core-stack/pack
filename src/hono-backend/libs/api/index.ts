import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { ApiError } from './error';

export function createApiSuccessResponseData(): ApiResponseData;
export function createApiSuccessResponseData<D extends object>(data: D, message?: string): ApiResponseData<D>;
export function createApiSuccessResponseData<D extends object>(message: string, data?: D): ApiResponseData<D>;
export function createApiSuccessResponseData(arg1?: any, arg2?: any) {
    if (typeof arg1 === 'string') {
        const message = arg1;
        arg1 = arg2;
        arg2 = message;
    }

    return {
        data: arg1,
        message: arg2 ?? '成功',
        success: true,
    };
}

export function throwApiError(statusCode?: ContentfulStatusCode): never;
export function throwApiError<D extends object>(statusCode: ContentfulStatusCode, data: D, message?: string): never;
export function throwApiError<D extends object>(statusCode: ContentfulStatusCode, message: string, data?: D): never;
export function throwApiError(statusCode?: ContentfulStatusCode, arg1?: any, arg2?: any) {
    throw new ApiError(statusCode, arg1, arg2);
}
