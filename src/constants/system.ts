import type { ReadonlyRecord } from '@kikiutils/shared/types';

import type { SystemConfigScopeToValuesMap } from '../types/system';

export enum SystemConfigScope {
    AdminManagement = 1,
    System = 0,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export const defaultSystemConfigs: Readonly<SystemConfigScopeToValuesMap> = {
    [SystemConfigScope.AdminManagement]: {},
    [SystemConfigScope.System]: {},
};

export const systemConfigScopeToTextMap: ReadonlyRecord<SystemConfigScope, string> = {
    [SystemConfigScope.AdminManagement]: '總後台',
    [SystemConfigScope.System]: '全系統',
};
