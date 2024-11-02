import { setReadonlyConstantToGlobalThis } from '@kikiutils/node';
import type { StatusCode } from 'hono/utils/http-status';

declare global {
	const createAPISuccessResponseData: {
		<D extends object>(data?: D, message?: string): APIResponseData<D>;
		<D extends object>(message?: string, data?: D): APIResponseData<D>;
	};

	const throwAPIError: {
		<D extends object>(statusCode?: StatusCode, data?: D, message?: string): never;
		<D extends object>(statusCode?: StatusCode, message?: string, data?: D): never;
	};
}

setReadonlyConstantToGlobalThis<typeof createAPISuccessResponseData>('createAPISuccessResponseData', (arg1, arg2) => {
	if (typeof arg1 === 'string') {
		let message = arg1;
		arg1 = arg2;
		arg2 = message;
	}

	return { data: arg1, message: arg2 ?? '成功', success: true };
});

setReadonlyConstantToGlobalThis<typeof throwAPIError>('throwAPIError', (statusCode, arg1, arg2) => {
	// @ts-expect-error
	throw new APIError(statusCode, arg1, arg2);
});
