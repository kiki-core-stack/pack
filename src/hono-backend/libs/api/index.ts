import type { ApiSuccessResponseData } from '../../../types/api';

export function createApiSuccessResponseData<D extends object | undefined = undefined>(
    data?: D,
): ApiSuccessResponseData<D> {
    return {
        data,
        success: true,
    };
}
