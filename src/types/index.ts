import type { ZodType, ZodTypeDef } from 'zod';

export type {} from '@kikiutils/mongoose/types';
export type {} from '@kikiutils/types';

declare global {
	type TwoFactorAuthenticationMethod = 'emailOtp' | 'totp';
	type TwoFactorAuthenticationStatus = Record<TwoFactorAuthenticationMethod, boolean>;
	type ZodValidatorType<Output = any, O extends Exclude<keyof Output, 'id' | keyof TwoFactorAuthenticationCodesData> = never, Def extends ZodTypeDef = ZodTypeDef, Input = Output> = ZodType<
		OmitMongooseTimestampAndOtherFields<Output, O | 'id' | keyof TwoFactorAuthenticationCodesData>,
		Def,
		Input
	>;
}
