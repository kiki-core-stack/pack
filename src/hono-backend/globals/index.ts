import type { Context } from 'hono';

import './api-utils';
import './classes/api-error';

declare global {
	function defineRouteHandler(handler: (ctx: Context) => Promise<Response> | Response): (ctx: Context) => Promise<Response> | Response;
}

globalThis.defineRouteHandler = (handler) => handler;
