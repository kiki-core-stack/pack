import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type {
    SetFieldType,
    SetRequired,
} from 'type-fest';
import type {
    output,
    ZodObject,
} from 'zod';

import type { FixedApiErrorCreator } from '../../types/api';

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

export function createFixedApiErrorCreator<
    S extends ContentfulStatusCode,
    E extends string,
    DataSchema extends ZodObject,
>(
    statusCode: S,
    errorCode: E,
    defaultMessage: string,
    dataSchema?: DataSchema,
) {
    return Object.assign(
        (data?: output<DataSchema>, message?: string) => {
            return new ApiError(statusCode, message ?? defaultMessage, errorCode, data);
        },
        {
            dataSchema,
            defaultMessage,
            errorCode,
            statusCode,
        },
    ) as FixedApiErrorCreator<S, E, DataSchema>;
}

export function throwApiError<D extends object | undefined = undefined, E extends string | undefined = undefined>(
    statusCode: ContentfulStatusCode = 500,
    message?: string,
    errorCode?: E,
    data?: D,
): never {
    throw new ApiError(statusCode, message, errorCode, data);
}
