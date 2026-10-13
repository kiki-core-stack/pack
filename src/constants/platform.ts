import type { ReadonlyRecord } from '@kikiutils/shared/types';

import type { PlatformConfigScopeToValuesMap } from '../types/platform';

export enum PlatformConfigScope {
    AdminManagement = 1,
    System = 0,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export const defaultPlatformConfigs: Readonly<PlatformConfigScopeToValuesMap> = {
    [PlatformConfigScope.AdminManagement]: {},
    [PlatformConfigScope.System]: {},
};

export const platformConfigScopeToTextMap: ReadonlyRecord<PlatformConfigScope, string> = {
    [PlatformConfigScope.AdminManagement]: '總後台',
    [PlatformConfigScope.System]: '全系統',
};
