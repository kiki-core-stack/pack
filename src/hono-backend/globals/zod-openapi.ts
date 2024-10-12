import type { ResponseConfig } from '@asteasolutions/zod-to-openapi';
import type { RouteConfig } from '@hono/zod-openapi';
import { defu } from 'defu';
import { mapValues } from 'lodash-es';
import type { SetOptional } from 'type-fest';

import { statusCodeToMessageMap } from '../constants/response';
import './zod';

type ApiRouteConfig = SetOptional<Omit<RouteConfig, 'path' | 'method'>, 'responses'>;

declare global {
	function createApiZodOpenApiJsonResponseConfig(dataObject?: ReturnType<(typeof z)['object']>, message?: string, isError?: boolean): ResponseConfig;
	function createApiZodOpenApiRouteConfig(operationId: string, description: string, tags?: string[], config?: ApiRouteConfig): ApiRouteConfig;
}

globalThis.createApiZodOpenApiJsonResponseConfig = (dataObject, message = '成功', isError) => ({
	description: message,
	content: {
		'application/json': {
			schema: z.object({
				data: dataObject || z.object({}),
				message: z.literal(message),
				success: z.literal(!isError)
			})
		}
	}
});

globalThis.createApiZodOpenApiRouteConfig = (operationId, description, tags, config) => defu({ ...config, description, operationId, tags }, defaultApiRouteConfig);
const defaultApiRouteConfig: ApiRouteConfig = { responses: mapValues(statusCodeToMessageMap, (message, code) => createApiZodOpenApiJsonResponseConfig(undefined, message, +code >= 400)) };
