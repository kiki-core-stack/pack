import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { SetFieldType } from 'type-fest';
import type {
    output,
    ZodObject,
} from 'zod';

import type { FixedApiErrorThrower } from '../../../types/hono-backend/api';

import { ApiError } from './error';

export function createApiSuccessResponseData<D extends object | undefined = undefined>(
    data?: D,
    message?: string,
): SetRequired<SetFieldType<ApiResponseData<D>, 'success', true>, 'data' | 'message'> {
    return {
        data: data!,
        message: message ?? '成功',
        success: true,
    };
}

export function createFixedApiErrorThrower<S extends ContentfulStatusCode, E extends string, DS extends ZodObject>(
    statusCode: S,
    errorCode: E,
    defaultMessage: string,
    dataSchema?: DS,
) {
    return Object.assign(
        (data?: output<DS>, message?: string) => {
            throwApiError(statusCode, message ?? defaultMessage, errorCode, data);
        },
        {
            dataSchema,
            errorCode,
            statusCode,
        },
    ) as FixedApiErrorThrower<S, E, DS>;
}

export function throwApiError<D extends object | undefined = undefined, E extends string | undefined = undefined>(
    statusCode: ContentfulStatusCode = 500,
    message?: string,
    errorCode?: E,
    data?: D,
): never {
    throw new ApiError(statusCode, message, errorCode, data);
}
