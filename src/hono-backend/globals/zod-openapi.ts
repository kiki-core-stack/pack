import type { ResponseConfig } from '@asteasolutions/zod-to-openapi';
import { z as _z } from '@hono/zod-openapi';
import type { RouteConfig } from '@hono/zod-openapi';
import { defu } from 'defu';
import type { SetOptional } from 'type-fest';

import { statusCodeToMessageMap } from './classes/api-error';

type ApiRouteConfig = SetOptional<Omit<RouteConfig, 'path' | 'method'>, 'responses'>;

declare global {
	function createApiZodOpenApiJsonResponseConfig(dataObject?: ReturnType<(typeof z)['object']>, message?: string, isError?: boolean): ResponseConfig;
	function createZodOpenApiRouteConfig(operationId: string, description: string, tags?: string[], config?: ApiRouteConfig): ApiRouteConfig;

	var z: typeof _z;
}

globalThis.createApiZodOpenApiJsonResponseConfig = (dataObject, message = '成功', isError) => {
	return {
		description: message,
		content: {
			'application/json': {
				schema: z.object({
					data: dataObject || z.object({}),
					message: z.string().default(message),
					success: z.boolean().default(!isError)
				})
			}
		}
	};
};

globalThis.createZodOpenApiRouteConfig = (operationId, description, tags, config) => defu({ ...config, description, operationId, tags }, defaultApiRouteConfig);
globalThis.z = _z;
const defaultApiRouteConfig: ApiRouteConfig = {
	request: { headers: z.object({ session: z.string().optional() }) },
	responses: Object.fromEntries(Object.entries(statusCodeToMessageMap).map(([code, message]) => [code, createApiZodOpenApiJsonResponseConfig(undefined, message, +code >= 400)]))
};
