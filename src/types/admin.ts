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
export type AdminLogMetadataVariant<T extends AdminLogType = AdminLogType> = DiscriminatedFieldVariant<
    'type',
    'metadata',
    AdminLogMetadataByType,
    T
>;

export type CreateAdminLogInput<T extends AdminLogType = AdminLogType> =
  & DiscriminatedFieldVariant<'type', 'metadata', AdminLogMetadataInputByType, T>
  & {
      admin: string | Types.ObjectId;
      ip?: string;
      note?: string;
  };
