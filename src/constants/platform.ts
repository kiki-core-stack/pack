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

export enum PlatformIpAccessPolicyMode {
    Allowlist = 0,
    Blacklist = 1,
}

export enum PlatformIpAccessPolicyScope {
    AdminManagement = 1,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export const defaultPlatformConfigs: Readonly<PlatformConfigScopeToValuesMap> = {
    [PlatformConfigScope.AdminManagement]: {},
    [PlatformConfigScope.System]: { ipAccessPolicy: { enabled: true } },
};

export const platformConfigScopeToTextMap: ReadonlyRecord<PlatformConfigScope, string> = {
    [PlatformConfigScope.AdminManagement]: '總後台',
    [PlatformConfigScope.System]: '全系統',
};

export const platformIpAccessPolicyModeToTextMap: ReadonlyRecord<PlatformIpAccessPolicyMode, string> = {
    [PlatformIpAccessPolicyMode.Allowlist]: '白名單',
    [PlatformIpAccessPolicyMode.Blacklist]: '黑名單',
};

// eslint-disable-next-line style/max-len
export const platformIpAccessPolicyScopeToTextMap: ReadonlyRecord<PlatformIpAccessPolicyScope, string> = { [PlatformIpAccessPolicyScope.AdminManagement]: '總後台' };
