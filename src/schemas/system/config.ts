import type { ReadonlyRecord } from '@kikiutils/shared/types';
import * as z from 'zod';

import { SystemConfigScope } from '../../constants/system';

export const systemConfigValidators = {
    [SystemConfigScope.AdminManagement]: z.object({}),
    [SystemConfigScope.System]: z.object({}),
} satisfies ReadonlyRecord<SystemConfigScope, z.ZodType>;
