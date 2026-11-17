import type { ReadonlyRecord } from '@kikiutils/shared/types';

import type { LocalizedMessages } from '../types/i18n';
import type {
    PlatformAuthConfig,
    PlatformConfigByScope,
} from '../types/platform';

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

export enum PlatformScope {
    AdminManagement = 1,
    System = 0,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // Uncomment the eslint-disable/enable lines below if `eslint --fix` would reorder these values.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

/**
 * 後台類入口的預設 auth 政策；下游新增後台類 scope 時沿用。
 */
export const defaultManagementPlatformAuthConfig: Readonly<PlatformAuthConfig> = {
    maxSessions: null,
    qrCodeLoginApprovalRequiresVerification: true,
    qrCodeLoginEnabled: false,
    session: {
        absoluteTimeoutSeconds: 3 * 86400,
        idleTimeoutSeconds: 4 * 3600,
    },
    twoFactorRequired: false,
};

/**
 * 前台使用者入口的預設 auth 政策；供下游的前台 scope 使用。
 */
export const defaultUserPlatformAuthConfig: Readonly<PlatformAuthConfig> = {
    maxSessions: null,
    qrCodeLoginApprovalRequiresVerification: false,
    qrCodeLoginEnabled: false,
    session: {
        absoluteTimeoutSeconds: 60 * 86400,
        idleTimeoutSeconds: 30 * 86400,
    },
    twoFactorRequired: false,
};

export const defaultPlatformConfigs: Readonly<PlatformConfigByScope> = {
    [PlatformScope.AdminManagement]: { auth: defaultManagementPlatformAuthConfig },
    [PlatformScope.System]: { ipAccessPolicy: { enabled: false } },
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

export const platformIpAccessPolicyCheckReasonToLabelMap: ReadonlyRecord<
    PlatformIpAccessPolicyCheckReason,
    LocalizedMessages
> = {
    [PlatformIpAccessPolicyCheckReason.Allowed]: {
        'en': 'Passed the IP access check',
        'zh-TW': '通過 IP 存取檢查',
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
        'zh-TW': 'IP 存取規則已停用',
    },
    [PlatformIpAccessPolicyCheckReason.InvalidIp]: {
        'en': 'Invalid source IP',
        'zh-TW': '來源 IP 無效',
    },
    [PlatformIpAccessPolicyCheckReason.NoApplicablePolicy]: {
        'en': 'No applicable IP access policy',
        'zh-TW': '沒有適用的 IP 存取規則',
    },
};

export const platformScopeToLabelMap: ReadonlyRecord<PlatformScope, LocalizedMessages> = {
    [PlatformScope.AdminManagement]: {
        'en': 'Admin management',
        'zh-TW': '總後台',
    },
    [PlatformScope.System]: {
        'en': 'System',
        'zh-TW': '全系統',
    },
};
