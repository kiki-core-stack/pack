import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { PlatformConfigScope } from '../constants/platform';
import * as z from '../libs/zod';

/**
 * Platform configs by `scope`. The scope is fixed on each stored config, so configs are validated with
 * `platformConfigVariants.parse(scope, config)`.
 */
export const platformConfigVariants = z.discriminatedMap(
    'scope',
    'config',
    {
        [PlatformConfigScope.AdminManagement]: z.object({}),
        [PlatformConfigScope.System]: z.object({ ipAccessPolicy: z.object({ enabled: z.boolean() }) }),
    } satisfies ReadonlyRecord<PlatformConfigScope, z.ZodType>,
);
