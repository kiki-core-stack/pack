import logger from '@kikiutils/node/consola';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Serve } from 'bun';

declare global {
	// @ts-ignore
	var honoApp: typeof _honoApp;
}

const badRequestErrorMessage = new ApiError(400).message;
const errorResponseHeaders = Object.freeze({ 'Content-Type': 'application/json' });
const _honoApp = new OpenAPIHono({
	defaultHook(result, ctx) {
		if (result.success) return;
		logger.info(result.error);
		return ctx.text(badRequestErrorMessage, 400, errorResponseHeaders);
	}
});

// @ts-ignore
globalThis.honoApp = _honoApp;

export default {
	fetch: _honoApp.fetch,
	hostname: process.env.SERVER_HOST || '127.0.0.1',
	port: +(process.env.SERVER_PORT || 8000),
	reusePort: true
} satisfies Serve;
