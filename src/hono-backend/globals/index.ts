import type { Context, Env, Input } from 'hono';

import './api-utils';
import './classes/api-error';

declare global {
	function defineRouteHandler<I extends Input = {}, E extends Env = any, P extends string = any>(handler: (ctx: Context<E, P, I>) => Promise<Response> | Response): (ctx: Context) => Promise<Response> | Response;
	function getClientIpFromXForwardedForHeader(ctx: Context): string | undefined;
}

globalThis.defineRouteHandler = (handler) => handler;
globalThis.getClientIpFromXForwardedForHeader = (ctx: Context) => {
	const xForwardedFor = ctx.req.header('x-forwarded-for');
	if (!xForwardedFor) return;
	const firstCommaIndex = xForwardedFor.indexOf(',');
	const clientIp = firstCommaIndex === -1 ? xForwardedFor : xForwardedFor.substring(0, firstCommaIndex);
	return clientIp.trim();
};
