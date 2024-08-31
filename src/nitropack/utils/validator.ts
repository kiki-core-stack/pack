import type { JSONSchemaType } from 'ajv';
import { getQuery, readBody } from 'h3';
import type { H3Event } from 'h3';
import { cloneDeep } from 'lodash-es';

import ApiError from '../../classes/api-error';
import { ajvValidator } from '../../utils/validator';

export const compileH3RequestDataValidator = <T>(schema: JSONSchemaType<T>, isQuery: boolean = false) => {
	const validator = ajvValidator.compile(schema);
	return async (event: H3Event) => {
		const data = cloneDeep(isQuery ? getQuery(event) : await readBody(event));
		if (!validator(data)) throw new ApiError(400);
		return data;
	};
};
