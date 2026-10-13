import type * as z from 'zod';

import type { SystemConfigScope } from '../constants/system';
import type { systemConfigValidators } from '../schemas/system/config';

export type SystemConfigScopeToValuesMap = { [S in SystemConfigScope]: z.infer<(typeof systemConfigValidators)[S]>; };
export type SystemConfigValues = SystemConfigScopeToValuesMap[SystemConfigScope];

// eslint-disable-next-line ts/no-namespace
export namespace SystemConfigs {
    export type AdminManagement = z.infer<(typeof systemConfigValidators)[SystemConfigScope.AdminManagement]>;
    export type System = z.infer<(typeof systemConfigValidators)[SystemConfigScope.System]>;
}
