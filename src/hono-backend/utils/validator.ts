import type { JSONSchemaType } from 'ajv';
import type { Context } from 'hono';

import { ajvValidator } from '../../utils/validator';

export const compileH3RequestDataValidator = <T>(schema: JSONSchemaType<T>, isQuery: boolean = false) => {
	const validator = ajvValidator.compile(schema);
	return async (ctx: Context) => {
		let data;
		if (isQuery) data = ctx.req.query();
		else data = ctx.req.header('content-type') === 'application/json' ? await ctx.req.json() : await ctx.req.parseBody();
		if (!validator(data)) createApiErrorAndThrow(400);
		return data;
	};
};
