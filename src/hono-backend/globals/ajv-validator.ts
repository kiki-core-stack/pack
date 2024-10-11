import type { JSONSchemaType } from 'ajv';
import type { Context } from 'hono';

import { ajvValidator } from '../../constants/ajv-validator';

declare global {
	function compileHonoRequestDataAjvValidator<T>(schema: JSONSchemaType<T>, isQuery?: boolean): (ctx: Context) => Promise<T>;
}

globalThis.compileHonoRequestDataAjvValidator = (schema, isQuery = false) => {
	const validator = ajvValidator.compile(schema);
	return async (ctx: Context) => {
		const data = isQuery ? ctx.req.query() : ctx.req.header('content-type') === 'application/json' ? await ctx.req.json() : await ctx.req.parseBody();
		if (!validator(data)) throwApiError(400);
		return data;
	};
};
