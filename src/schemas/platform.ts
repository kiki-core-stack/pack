import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { PlatformConfigScope } from '../constants/platform';
import * as z from '../libs/zod';
import type { PlatformConfigByScope } from '../types/platform';

export const platformConfigSchemas = {
    [PlatformConfigScope.AdminManagement]: z.object({}),
    [PlatformConfigScope.System]: z.object({ ipAccessPolicy: z.object({ enabled: z.boolean() }) }),
} satisfies ReadonlyRecord<PlatformConfigScope, z.ZodType>;

// Functions
export async function parsePlatformConfig<S extends PlatformConfigScope>(scope: S, input: unknown) {
    return await platformConfigSchemas[scope].parseAsync(input) as PlatformConfigByScope[S];
}
