import type * as z from 'zod';

import type { PlatformConfigScope } from '../constants/platform';
import type { platformConfigValidators } from '../schemas/platform/config';

export type PlatformConfigScopeToValuesMap = {
    [S in PlatformConfigScope]: z.infer<(typeof platformConfigValidators)[S]>;
};

export type PlatformConfigValues = PlatformConfigScopeToValuesMap[PlatformConfigScope];

// eslint-disable-next-line ts/no-namespace
export namespace PlatformConfigs {
    export type AdminManagement = z.infer<(typeof platformConfigValidators)[PlatformConfigScope.AdminManagement]>;
    export type System = z.infer<(typeof platformConfigValidators)[PlatformConfigScope.System]>;
}
