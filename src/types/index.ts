import type { ZodType } from 'zod';

export type * as _loadKikiutilsMongooseTypes from '@kikiutils/mongoose/types';
export type * as _loadKikiutilsTypes from '@kikiutils/types';

type ZodValidatorTypeExcludeField = 'id' | keyof WithAdminAuditData;

declare global {
    type ZodValidatorType<
        Output = any,
        O extends Exclude<keyof Output, ZodValidatorTypeExcludeField> = never,
    > = ZodType<OmitMongooseTimestampAndOtherFields<Output, O | ZodValidatorTypeExcludeField>>;
}
