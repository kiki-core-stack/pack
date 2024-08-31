export function createResponseData<D extends object>(data?: D, message?: string): ApiResponseData<D>;
export function createResponseData<D extends object>(message?: string, data?: D): ApiResponseData<D>;
export function createResponseData(arg1: any, arg2?: any) {
	if (typeof arg1 === 'string') [arg1, arg2] = [arg2, arg1];
	return { data: arg1 || {}, message: arg2 || '成功', success: true };
}
