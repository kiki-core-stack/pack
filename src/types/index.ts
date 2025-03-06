import type {
    ZodType,
    ZodTypeDef,
} from 'zod';

export type {} from '@kikiutils/mongoose/types';
export type {} from '@kikiutils/types';
export type {} from '@kikiutils/types/type-fest';

type ZodValidatorTypeExcludeField =
  | 'createdByAdmin'
  | 'editedByAdmin'
  | 'id'
  | keyof TwoFactorAuthenticationCodesData;

declare global {
    type TwoFactorAuthenticationMethod = 'emailOtp' | 'totp';
    type TwoFactorAuthenticationStatus = Record<TwoFactorAuthenticationMethod, boolean>;
    type ZodValidatorType<
        Output = any,
        O extends Exclude<keyof Output, ZodValidatorTypeExcludeField> = never,
        Def extends ZodTypeDef = ZodTypeDef,
    > = ZodType<OmitMongooseTimestampAndOtherFields<Output, O | ZodValidatorTypeExcludeField>, Def>;
}
