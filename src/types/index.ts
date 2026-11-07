import type { OmitMongooseTimestampAndOtherFields } from '@kikiutils/mongoose/types';

import type * as z from '../libs/zod';

import type { WithAdminAuditData } from './data';

export type * as _loadTypes1 from '@kikiutils/mongoose/plugins/assertions';
export type * as _loadTypes2 from '@kikiutils/mongoose/types/paginate';

/**
 * Pairs each discriminator value with its own field value.
 * The field becomes optional when its value accepts `undefined`.
 */
export type DiscriminatedFieldVariant<
    DiscriminatorKey extends string,
    FieldKey extends string,
    ValueMap extends object,
    K extends keyof ValueMap = keyof ValueMap,
> = {
    [P in K]:
      & Record<DiscriminatorKey, P>
      & (undefined extends ValueMap[P] ? Partial<Record<FieldKey, ValueMap[P]>> : Record<FieldKey, ValueMap[P]>);
}[K];

export type ManagementType = 'admin';
export type ZodSchemaMapInput<M extends Record<keyof M, z.ZodType>> = { [K in keyof M]: z.input<M[K]> };
export type ZodSchemaMapOutput<M extends Record<keyof M, z.ZodType>> = { [K in keyof M]: z.output<M[K]> };
export type ZodValidatorType<
    Output = any,
    O extends Exclude<keyof Output, ZodValidatorTypeExcludeField> = never,
    Exclude_idField extends boolean = true,
> = z.ZodType<
    OmitMongooseTimestampAndOtherFields<
        Output,
        | (Exclude_idField extends true ? '_id' : never)
        | O
        | ZodValidatorTypeExcludeField
    >
>;

type ZodValidatorTypeExcludeField = 'id' | keyof WithAdminAuditData;
