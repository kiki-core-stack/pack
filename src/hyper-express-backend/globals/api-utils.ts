import type { Response } from '@kikiutils/hyper-express';

declare global {
	const createApiSuccessResponseData: {
		<D extends object>(data?: D, message?: string): ApiResponseData<D>;
		<D extends object>(message?: string, data?: D): ApiResponseData<D>;
	};

	const sendApiSuccessResponse: {
		<D extends object>(response: Response, data?: D, message?: string): boolean;
		<D extends object>(response: Response, message?: string, data?: D): boolean;
	};

	const throwApiError: {
		<D extends object>(statusCode?: number, data?: D, message?: string): never;
		<D extends object>(statusCode?: number, message?: string, data?: D): never;
	};
}

Object.defineProperty(globalThis, 'createApiSuccessResponseData', {
	configurable: false,
	value(arg1: any, arg2?: any) {
		if (typeof arg1 === 'string') {
			let message = arg1;
			arg1 = arg2;
			arg2 = message;
		}

		return { data: arg1 || {}, message: arg2 ?? '成功', success: true };
	},
	writable: false
});

Object.defineProperty(globalThis, 'sendApiSuccessResponse', {
	configurable: false,
	value: (response: Response, arg1: any, arg2?: any) => response.json(createApiSuccessResponseData(arg1, arg2)),
	writable: false
});

Object.defineProperty(globalThis, 'throwApiError', {
	configurable: false,
	value(statusCode?: number, arg1?: any, arg2?: any) {
		throw new ApiError(statusCode, arg1, arg2);
	},
	writable: false
});
