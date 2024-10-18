import type { Response } from '@kikiutils/hyper-express';
import { setReadonlyConstantToGlobalThis } from '@kikiutils/node';

declare global {
	const createAPISuccessResponseData: {
		<D extends object>(data?: D, message?: string): APIResponseData<D>;
		<D extends object>(message?: string, data?: D): APIResponseData<D>;
	};

	const sendAPISuccessResponse: {
		<D extends object>(response: Response, data?: D, message?: string): boolean;
		<D extends object>(response: Response, message?: string, data?: D): boolean;
	};

	const throwAPIError: {
		<D extends object>(statusCode?: number, data?: D, message?: string): never;
		<D extends object>(statusCode?: number, message?: string, data?: D): never;
	};
}

setReadonlyConstantToGlobalThis('createAPISuccessResponseData', (arg1: any, arg2?: any) => {
	if (typeof arg1 === 'string') {
		let message = arg1;
		arg1 = arg2;
		arg2 = message;
	}

	return { data: arg1 || {}, message: arg2 ?? '成功', success: true };
});

setReadonlyConstantToGlobalThis('sendAPISuccessResponse', (response: Response, arg1: any, arg2?: any) => response.json(createAPISuccessResponseData(arg1, arg2)));
setReadonlyConstantToGlobalThis('throwAPIError', (statusCode?: number, arg1?: any, arg2?: any) => {
	throw new APIError(statusCode, arg1, arg2);
});
