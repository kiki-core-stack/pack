import type { JSONSchemaType } from 'ajv';

export type {} from '@kikiutils/types';

declare global {
	type AjvValidatorJSONSchema<T, O extends keyof T | 'id' = 'id'> = JSONSchemaType<OmitMongooseTimestampAndOtherFields<T, O | 'id'>>;
}
