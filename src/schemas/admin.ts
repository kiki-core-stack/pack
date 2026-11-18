import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { AdminLogType } from '../constants/admin';
import * as z from '../libs/zod';

/**
 * Admin log metadata by `type`; validate with `adminLogMetadataVariants.parse(type, metadata)`.
 */
export const adminLogMetadataVariants = z.discriminatedMap(
    'type',
    'metadata',
    { [AdminLogType.Other]: z.undefined() } satisfies ReadonlyRecord<AdminLogType, z.ZodType>,
);
