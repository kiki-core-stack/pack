import { setReadonlyConstantToGlobalThis } from '@kikiutils/node';

import { statusCodeToResponseMessageMap } from '../constants/response';

declare global {
	type APIError<D extends object = any> = LocalAPIError<D>;

	const APIError: typeof LocalAPIError;
}

class LocalAPIError<D extends object> extends Error {
	data: D;
	statusCode: number;

	constructor(statusCode?: number, data?: D, message?: string);
	constructor(statusCode?: number, message?: string, data?: D);
	constructor(statusCode: number = 500, arg1: any, arg2?: any) {
		if (typeof arg1 === 'string') {
			let message = arg1;
			arg1 = arg2;
			arg2 = message;
		}

		super(arg2 ?? (statusCodeToResponseMessageMap[statusCode] || '系統錯誤！'));
		this.data = arg1;
		this.statusCode = statusCode;
		Error.captureStackTrace?.(this, this.constructor);
	}
}

setReadonlyConstantToGlobalThis('APIError', LocalAPIError);
