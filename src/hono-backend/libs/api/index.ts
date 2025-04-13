import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { SetFieldType } from 'type-fest';

import { ApiError } from './error';

export function createApiSuccessResponseData<D extends object | undefined = undefined>(
    data?: D,
    message?: string,
): SetRequired<SetFieldType<ApiResponseData<D>, 'success', true>, 'data' | 'message'> {
    return {
        data: data!,
        message: message ?? '成功！',
        success: true,
    };
}

export function defineApiErrorMapByErrorCode<Error extends ApiError<any>>(
    error: Error
): Readonly<{ [errorCode in Error['errorCode']]: Error }>;
export function defineApiErrorMapByErrorCode<Errors extends ApiError<any>[]>(
    errorList: Errors,
): Readonly<{ [Error in Errors[number] as Error['errorCode']]: Error }>;
export function defineApiErrorMapByErrorCode(input: Arrayable<ApiError<any>>) {
    const errors = Array.isArray(input) ? input : [input];
    const errorMap: any = {};
    for (const error of errors) errorMap[error.errorCode] = error;
    return errorMap;
}

export function throwApiError<D extends object | undefined = undefined, E extends string | undefined = undefined>(
    statusCode: ContentfulStatusCode = 500,
    message?: string,
    errorCode?: E,
    data?: D,
): never {
    throw new ApiError(statusCode, message, errorCode, data);
}
