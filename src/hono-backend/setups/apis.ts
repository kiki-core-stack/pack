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
const startAt = performance.now();
const matchApiFilePathRegex = new RegExp(`^src/apis(.*?)(/index)?\\.(${allowedMethods.join('|')})\\.ts$`);
const apiFilePaths = await glob(`src/apis/**/*.{${allowedMethods.join(',')}}.ts`);
for (const apiFilePath of apiFilePaths) {
	const realApiFilePath = resolve(apiFilePath);
	try {
		const apiModule = (await import(realApiFilePath)).default;
		if (!apiModule) continue;
		const matches = apiFilePath.match(matchApiFilePathRegex);
		if (!matches) continue;
		honoApp.on(matches[3]!, `/api${matches[1]!}`, apiModule);
		apisCount++;
	} catch (error) {
		// @ts-expect-error
		logger.error(`Error loading API file: ${realApiFilePath}`, error?.message, error);
	}
}

logger.info(`Loaded ${apisCount} APIs in ${(performance.now() - startAt).toFixed(2)}ms`);
