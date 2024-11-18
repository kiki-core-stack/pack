import type { ZodType, ZodTypeDef } from 'zod';

export type {} from '@kikiutils/mongoose/types';
export type {} from '@kikiutils/types';
export type {} from '@kikiutils/types/type-fest';

declare global {
	type TwoFactorAuthenticationMethod = 'emailOTP' | 'totp';
	type TwoFactorAuthenticationStatus = Record<TwoFactorAuthenticationMethod, boolean>;
	type ZodValidatorType<Output = any, O extends Exclude<keyof Output, 'createdByAdmin' | 'editedByAdmin' | 'id' | keyof TwoFactorAuthenticationCodesData> = never, Def extends ZodTypeDef = ZodTypeDef> = ZodType<OmitMongooseTimestampAndOtherFields<Output, O | 'createdByAdmin' | 'editedByAdmin' | 'id' | keyof TwoFactorAuthenticationCodesData>, Def>;
}
