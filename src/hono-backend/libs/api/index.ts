import type { ApiSuccessResponseData } from '../../../types/data';

export function createApiSuccessResponseData<D extends object | undefined = undefined>(
    data?: D,
    message?: string,
): ApiSuccessResponseData<D> {
    return {
        data,
        message,
        success: true,
    };
}
