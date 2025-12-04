import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { SetFieldType } from 'type-fest';

import type { ApiResponseData } from '../../../types/data';
import type { CommonApiResponseErrorCode } from '../../types/api';

import { ApiError } from './error';

export function createApiSuccessResponseData<D extends object | undefined = undefined>(
    data?: D,
    message?: string,
): SetFieldType<ApiResponseData<D>, 'success', true> {
    return {
        data,
        message,
        success: true,
    };
}

export function throwApiError<
    D extends object | undefined = undefined,
    E extends CommonApiResponseErrorCode | (string & {}) | undefined = undefined,
>(
    statusCode: ContentfulStatusCode = 500,
    errorCode?: E,
    data?: D,
    message?: string,
): never {
    throw new ApiError(statusCode, errorCode, data, message);
}
