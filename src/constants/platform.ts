import type { ReadonlyRecord } from '@kikiutils/shared/types';

import type { LocalizedMessages } from '../types/i18n';
import type { PlatformConfigByScope } from '../types/platform';

export enum PlatformConfigScope {
    AdminManagement = 1,
    System = 0,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // Uncomment the eslint-disable/enable lines below if `eslint --fix` would reorder these values.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export enum PlatformIpAccessPolicyCheckReason {
    Allowed = 0,
    AllowlistMiss = 5,
    BlacklistMatch = 4,
    Disabled = 1,
    InvalidIp = 3,
    NoApplicablePolicy = 2,
}

export enum PlatformIpAccessPolicyMode {
    Allowlist = 0,
    Blacklist = 1,
}

export enum PlatformIpAccessPolicyScope {
    AdminManagement = 1,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // Uncomment the eslint-disable/enable lines below if `eslint --fix` would reorder these values.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export const defaultPlatformConfigs: Readonly<PlatformConfigByScope> = {
    [PlatformConfigScope.AdminManagement]: {},
    [PlatformConfigScope.System]: { ipAccessPolicy: { enabled: false } },
};

export const platformConfigScopeToLabelMap: ReadonlyRecord<PlatformConfigScope, LocalizedMessages> = {
    [PlatformConfigScope.AdminManagement]: {
        'en': 'Admin management',
        'zh-TW': '總後台',
    },
    [PlatformConfigScope.System]: {
        'en': 'System',
        'zh-TW': '全系統',
    },
};

export const platformIpAccessPolicyModeToLabelMap: ReadonlyRecord<PlatformIpAccessPolicyMode, LocalizedMessages> = {
    [PlatformIpAccessPolicyMode.Allowlist]: {
        'en': 'Allowlist',
        'zh-TW': '白名單',
    },
    [PlatformIpAccessPolicyMode.Blacklist]: {
        'en': 'Blacklist',
        'zh-TW': '黑名單',
    },
};

export const platformIpAccessPolicyScopeToLabelMap: ReadonlyRecord<PlatformIpAccessPolicyScope, LocalizedMessages> = {
    [PlatformIpAccessPolicyScope.AdminManagement]: {
        'en': 'Admin management',
        'zh-TW': '總後台',
    },
};

export const platformIpAccessPolicyCheckReasonToLabelMap: ReadonlyRecord<
    PlatformIpAccessPolicyCheckReason,
    LocalizedMessages
> = {
    [PlatformIpAccessPolicyCheckReason.Allowed]: {
        'en': 'Passed the IP access check',
        'zh-TW': '通過IP存取檢查',
    },
    [PlatformIpAccessPolicyCheckReason.AllowlistMiss]: {
        'en': 'Not in the allowlist',
        'zh-TW': '未命中白名單',
    },
    [PlatformIpAccessPolicyCheckReason.BlacklistMatch]: {
        'en': 'Matched the blacklist',
        'zh-TW': '命中黑名單',
    },
    [PlatformIpAccessPolicyCheckReason.Disabled]: {
        'en': 'IP access policies are disabled',
        'zh-TW': 'IP存取規則已停用',
    },
    [PlatformIpAccessPolicyCheckReason.InvalidIp]: {
        'en': 'Invalid source IP',
        'zh-TW': '來源IP無效',
    },
    [PlatformIpAccessPolicyCheckReason.NoApplicablePolicy]: {
        'en': 'No applicable IP access policy',
        'zh-TW': '沒有適用的IP存取規則',
    },
};
