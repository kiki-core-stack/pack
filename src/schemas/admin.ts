import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { AdminLogType } from '../constants/admin';
import * as z from '../libs/zod';
import type { AdminLogMetadataByType } from '../types/admin';

export const adminLogMetadataSchemas = {
    [AdminLogType.LoginFailure]: z.undefined(),
    [AdminLogType.LoginSuccess]: z.undefined(),
} satisfies ReadonlyRecord<AdminLogType, z.ZodType>;

// Functions
export async function parseAdminLogMetadata<T extends AdminLogType>(type: T, input: unknown) {
    return await adminLogMetadataSchemas[type].parseAsync(input) as AdminLogMetadataByType[T];
}
