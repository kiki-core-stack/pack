import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type {
    SetFieldType,
    SetRequired,
} from 'type-fest';

import { ApiError } from './error';

export function createApiSuccessResponseData<D extends object | undefined = undefined>(data?: D, message?: string) {
    return {
        data,
        message: message ?? '成功！',
        success: true,
    } as SetRequired<SetFieldType<ApiResponseData<D>, 'success', true>, 'data' | 'message'>;
}

export function throwApiError<D extends object | undefined = undefined, E extends string | undefined = undefined>(
    statusCode: ContentfulStatusCode = 500,
    message?: string,
    errorCode?: E,
    data?: D,
): never {
    throw new ApiError(statusCode, message, errorCode, data);
}
