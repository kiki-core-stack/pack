import type { Context, Env, Input } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import type { Promisable } from 'type-fest';

import { jsonResponseHeaders } from '../constants/response';

declare global {
	function createApiSuccessResponseData<D extends object>(data?: D, message?: string): ApiResponseData<D>;
	function createApiSuccessResponseData<D extends object>(message?: string, data?: D): ApiResponseData<D>;
	function defineApiRouteHandler<I extends Input = {}, E extends Env = any, P extends string = any, D extends object = {}>(handler: (ctx: Context<E, P, I>) => Promisable<ApiResponseData<D> | void>): (ctx: Context) => Promise<Response>;
	function throwApiError<D extends object>(statusCode?: StatusCode, data?: D, message?: string): never;
	function throwApiError<D extends object>(statusCode?: StatusCode, message?: string, data?: D): never;
}

globalThis.createApiSuccessResponseData = (arg1: any, arg2?: any) => {
	if (typeof arg1 === 'string') [arg1, arg2] = [arg2, arg1];
	return { data: arg1 || {}, message: arg2 ?? '成功', success: true };
};

globalThis.defineApiRouteHandler = (handler) => async (ctx: Context) => {
	const data = await handler(ctx);
	if (!data) return ctx.text(apiSuccessResponseText, 200, jsonResponseHeaders);
	return ctx.json(data);
};

globalThis.throwApiError = (statusCode?: StatusCode, arg1?: any, arg2?: any) => {
	throw new ApiError(statusCode, arg1, arg2);
};

const apiSuccessResponseText = JSON.stringify(createApiSuccessResponseData());
