import { createError } from 'h3';

const statusCodeToMessageMap: Record<number, string> = {
	400: '資料格式錯誤或是非法操作！',
	401: 'unauthorized',
	404: '找不到資料！',
	409: '欄位值重複或是該資料使用中！',
	500: '系統錯誤！'
};

export function createH3ErrorAndThrow<D extends object>(statusCode?: number, data?: D, message?: string): never;
export function createH3ErrorAndThrow<D extends object>(statusCode?: number, message?: string, data?: D): never;
export function createH3ErrorAndThrow(statusCode: number = 500, arg1: any, arg2?: any) {
	if (typeof arg1 === 'string') [arg1, arg2] = [arg2, arg1];
	throw createError({ message: JSON.stringify({ data: arg1 || {}, message: arg2 || statusCodeToMessageMap[statusCode] || '系統錯誤！', success: false }), status: statusCode, statusCode });
}

export function createResponseData<D extends object>(data?: D, message?: string): ApiResponseData<D>;
export function createResponseData<D extends object>(message?: string, data?: D): ApiResponseData<D>;
export function createResponseData(arg1: any, arg2?: any) {
	if (typeof arg1 === 'string') [arg1, arg2] = [arg2, arg1];
	return { data: arg1 || {}, message: arg2 || '成功', success: true };
}
