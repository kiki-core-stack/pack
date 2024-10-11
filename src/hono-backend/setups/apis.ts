import logger from '@kikiutils/node/consola';
import { glob } from 'glob';
import { resolve } from 'path';

const allowedMethods = [
	'delete',
	'get',
	'head',
	'link',
	'options',
	'patch',
	'post',
	'purge',
	'put',
	'unlink'
] as const;

let apisCount = 0;
let createZodOpenApiRoute;
const startAt = performance.now();
const matchApiFilePathRegex = new RegExp(`^src/apis(.*?)(/index)?\\.(${allowedMethods.join('|')})\\.ts$`);
const apiFilePaths = await glob(`src/apis/**/*.{${allowedMethods.join(',')}}.ts`);
for (const apiFilePath of apiFilePaths) {
	const realApiFilePath = resolve(apiFilePath);
	try {
		const apiModule = await import(realApiFilePath);
		if (!apiModule.default) continue;
		const matches = apiFilePath.match(matchApiFilePathRegex);
		if (!matches) continue;
		const method = matches[3]!;
		const urlPath = `/api${matches[1]!}`;
		if (apiModule.zodOpenApiRouteConfig) {
			if (!createZodOpenApiRoute) createZodOpenApiRoute = (await import('@hono/zod-openapi')).createRoute;
			// @ts-expect-error
			honoApp.openapi(createZodOpenApiRoute({ ...apiModule.zodOpenApiRouteConfig, path: urlPath.replace(/:(\w+?)(\/|$)/g, '{$1}$2'), method }), apiModule.default, apiModule.zodOpenApiRouteHook);
		} else honoApp.on(method, urlPath, apiModule.default);
		apisCount++;
	} catch (error) {
		// @ts-expect-error
		logger.error(`Error loading API file: ${realApiFilePath}`, error?.message, error);
	}
}

logger.info(`Loaded ${apisCount} APIs in ${(performance.now() - startAt).toFixed(2)}ms`);
