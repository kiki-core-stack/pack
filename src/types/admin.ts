import type { Types } from 'mongoose';

import type { AdminLogType } from '../constants/admin';
import type { adminLogMetadataVariants } from '../schemas/admin';

import type {
    DiscriminatedFieldVariant,
    ZodSchemaMapInput,
    ZodSchemaMapOutput,
} from './';

export type AdminLogMetadataByType = ZodSchemaMapOutput<typeof adminLogMetadataVariants['schemas']>;
export type AdminLogMetadataInputByType = ZodSchemaMapInput<typeof adminLogMetadataVariants['schemas']>;
type AdminLogMetadataType = keyof AdminLogMetadataByType;

/**
 * Falls back to a plain shape while no log type is defined, so the model and its data types stay usable.
 */
export type AdminLogMetadataVariant<T extends AdminLogMetadataType = AdminLogMetadataType> =
    [T] extends [never]
        ? { metadata?: undefined; type: AdminLogType }
        : DiscriminatedFieldVariant<'type', 'metadata', AdminLogMetadataByType, T>;

/**
 * Cannot be constructed while no log type is defined (`type` is `never`).
 */
export type CreateAdminLogInput<T extends AdminLogMetadataType = AdminLogMetadataType> =
  & ([T] extends [never]
      ? { metadata?: undefined; type: never }
      : DiscriminatedFieldVariant<'type', 'metadata', AdminLogMetadataInputByType, T>)
    & {
        admin: string | Types.ObjectId;
        ip?: string;
        note?: string;
    };
