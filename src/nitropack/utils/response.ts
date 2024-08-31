import ApiError from '../../classes/api-error';

export function createApiError<D extends object>(statusCode?: number, data?: D, message?: string): ApiError<D>;
export function createApiError<D extends object>(statusCode?: number, message?: string, data?: D): ApiError<D>;
export function createApiError(statusCode: number = 500, arg1: any, arg2?: any) {
	return new ApiError(statusCode, arg1, arg2);
}

export function createApiErrorAndThrow<D extends object>(statusCode?: number, data?: D, message?: string): never;
export function createApiErrorAndThrow<D extends object>(statusCode?: number, message?: string, data?: D): never;
export function createApiErrorAndThrow(statusCode: number = 500, arg1: any, arg2?: any) {
	throw createApiError(statusCode, arg1, arg2);
}

export function createResponseData<D extends object>(data?: D, message?: string): ApiResponseData<D>;
export function createResponseData<D extends object>(message?: string, data?: D): ApiResponseData<D>;
export function createResponseData(arg1: any, arg2?: any) {
	if (typeof arg1 === 'string') [arg1, arg2] = [arg2, arg1];
	return { data: arg1 || {}, message: arg2 || '成功', success: true };
}
