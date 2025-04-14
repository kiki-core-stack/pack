import type {
    ZodType,
    ZodTypeDef,
} from 'zod';

export type {} from '@kikiutils/mongoose/types';
export type {} from '@kikiutils/types';

type ZodValidatorTypeExcludeField =
  | 'createdByAdmin'
  | 'editedByAdmin'
  | 'id';

declare global {
    type ZodValidatorType<
        Output = any,
        O extends Exclude<keyof Output, ZodValidatorTypeExcludeField> = never,
        Def extends ZodTypeDef = ZodTypeDef,
    > = ZodType<
        OmitMongooseTimestampAndOtherFields<Output, O | ZodValidatorTypeExcludeField>,
        Def
    >;
}
