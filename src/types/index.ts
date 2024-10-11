import type { JSONSchemaType } from 'ajv';

export type {} from '@kikiutils/mongoose/types';
export type {} from '@kikiutils/types';

declare global {
	type AjvValidatorJSONSchema<T, O extends Exclude<keyof T, 'id' | keyof TwoFactorAuthenticationCodesData> = never> = JSONSchemaType<OmitMongooseTimestampAndOtherFields<T, O | 'id' | keyof TwoFactorAuthenticationCodesData>>;
	type TwoFactorAuthenticationMethod = 'emailOtp' | 'totp';
	type TwoFactorAuthenticationStatus = Record<TwoFactorAuthenticationMethod, boolean>;
}
