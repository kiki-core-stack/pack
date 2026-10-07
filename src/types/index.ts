import type { OmitMongooseTimestampAndOtherFields } from '@kikiutils/mongoose/types';
import type { ZodType } from 'zod';

import type { WithAdminAuditData } from './data';

export type * as _loadTypes1 from '@kikiutils/mongoose/plugins/assertions';
export type * as _loadTypes2 from '@kikiutils/mongoose/types/paginate';

export type ManagementType = 'admin';
export type ZodValidatorType<
    Output = any,
    O extends Exclude<keyof Output, ZodValidatorTypeExcludeField> = never,
    Exclude_idField extends boolean = true,
> = ZodType<
    OmitMongooseTimestampAndOtherFields<
        Output,
        | (Exclude_idField extends true ? '_id' : never)
        | O
        | ZodValidatorTypeExcludeField
    >
>;

type ZodValidatorTypeExcludeField = 'id' | keyof WithAdminAuditData;
