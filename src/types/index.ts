import type { ZodType, ZodTypeDef } from 'zod';

export type {} from '@kikiutils/mongoose/types';
export type {} from '@kikiutils/types';

declare global {
	type TwoFactorAuthenticationMethod = 'emailOtp' | 'totp';
	type TwoFactorAuthenticationStatus = Record<TwoFactorAuthenticationMethod, boolean>;
	type ZodValidatorType<Output = any, O extends Exclude<keyof Output, 'createdByAdmin' | 'editedByAdmin' | 'id' | keyof TwoFactorAuthenticationCodesData> = never, Def extends ZodTypeDef = ZodTypeDef> = ZodType<
		OmitMongooseTimestampAndOtherFields<Output, O | 'createdByAdmin' | 'editedByAdmin' | 'id' | keyof TwoFactorAuthenticationCodesData>,
		Def
	>;
}
