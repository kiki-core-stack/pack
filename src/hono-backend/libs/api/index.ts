import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { SetFieldType } from 'type-fest';
import type {
    output,
    ZodObject,
} from 'zod';

import type { ApiResponseData } from '../../../types/data';
import type { FixedApiErrorCreator } from '../../types/api';

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

// TODO: other method
export function createFixedApiErrorCreator<
    S extends ContentfulStatusCode,
    E extends string,
    DataSchema extends ZodObject,
>(
    statusCode: S,
    errorCode: E,
    dataSchema?: DataSchema,
    defaultMessage?: string,
) {
    return Object.assign(
        (data?: output<DataSchema>, message?: string) => {
            return new ApiError(statusCode, errorCode, data, message ?? defaultMessage);
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
    errorCode?: E,
    data?: D,
    message?: string,
): never {
    throw new ApiError(statusCode, errorCode, data, message);
}
