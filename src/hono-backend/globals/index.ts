import type { Context } from 'hono';

import './api-utils';
import './classes/api-error';

declare global {
	function defineRouteHandler(handler: (ctx: Context) => Promise<Response> | Response): (ctx: Context) => Promise<Response> | Response;
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
