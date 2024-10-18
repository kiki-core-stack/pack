import type { ResponseConfig } from '@asteasolutions/zod-to-openapi';
import type { RouteConfig } from '@hono/zod-openapi';
import { defu } from 'defu';
import { mapValues } from 'lodash-es';
import type { SetOptional } from 'type-fest';

import { statusCodeToMessageMap } from '../constants/response';
import './zod';

type APIRouteConfig = SetOptional<Omit<RouteConfig, 'path' | 'method'>, 'responses'>;

declare global {
	function createAPIZodOpenAPIJsonResponseConfig(dataObject?: ReturnType<(typeof z)['object']>, message?: string, isError?: boolean): ResponseConfig;
	function createAPIZodOpenAPIRouteConfig(operationId: string, description: string, tags?: string[], config?: APIRouteConfig): APIRouteConfig;
}

globalThis.createAPIZodOpenAPIJsonResponseConfig = (dataObject, message = '成功', isError) => ({
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

globalThis.createAPIZodOpenAPIRouteConfig = (operationId, description, tags, config) => defu({ ...config, description, operationId, tags }, defaultAPIRouteConfig);
const defaultAPIRouteConfig: APIRouteConfig = { responses: mapValues(statusCodeToMessageMap, (message, code) => createAPIZodOpenAPIJsonResponseConfig(undefined, message, +code >= 400)) };
