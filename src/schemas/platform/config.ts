import type { ReadonlyRecord } from '@kikiutils/shared/types';
import * as z from 'zod';

import { PlatformConfigScope } from '../../constants/platform';

export const platformConfigValidators = {
    [PlatformConfigScope.AdminManagement]: z.object({}),
    [PlatformConfigScope.System]: z.object({}),
} satisfies ReadonlyRecord<PlatformConfigScope, z.ZodType>;
