import type { Response } from '@kikiutils/hyper-express';

declare global {
	function sendApiSuccessResponse<D extends object>(response: Response, data?: D, message?: string): boolean;
	function sendApiSuccessResponse<D extends object>(response: Response, message?: string, data?: D): boolean;
	function throwApiError<D extends object>(statusCode?: number, data?: D, message?: string): never;
	function throwApiError<D extends object>(statusCode?: number, message?: string, data?: D): never;
}

globalThis.sendApiSuccessResponse = (response, arg1, arg2?) => {
	if (typeof arg1 === 'string') {
		let message = arg1;
		arg1 = arg2;
		arg2 = message;
	}

	return response.json({ data: arg1 || {}, message: arg2 ?? '成功', success: true });
};

globalThis.throwApiError = (statusCode?: number, arg1?: any, arg2?: any) => {
	throw new ApiError(statusCode, arg1, arg2);
};
