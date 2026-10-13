import type * as z from 'zod';

import type {
    PlatformConfigScope,
    PlatformIpAccessPolicyCheckReason,
    PlatformIpAccessPolicyMode,
    PlatformIpAccessPolicyScope,
} from '../constants/platform';
import type { platformConfigValidators } from '../schemas/platform/config';

import type { PlatformIpAccessPolicyData } from './data/platform';
import type { IpAddressRange } from './ip';

export type PlatformConfigScopeToValuesMap = {
    [S in PlatformConfigScope]: z.infer<(typeof platformConfigValidators)[S]>;
};

export type PlatformConfigValues = PlatformConfigScopeToValuesMap[PlatformConfigScope];

/** 同一目標內的條件為 AND，不同目標之間為 OR；null 表示不限制。 */
export type PlatformIpAccessPolicyTarget =
  | {
      /** null 表示該身分類型的所有帳號；指定帳號時必須為非空陣列。 */
      principalIds: null | string[];
      principalType: 'admin';
      scope: PlatformIpAccessPolicyScope.AdminManagement;
  }
  | {
      principalIds: null;
      principalType: null;
      scope: null;
  }
  | {
      principalIds: null;
      principalType: null;
      scope: PlatformIpAccessPolicyScope;
  };

// eslint-disable-next-line ts/no-namespace
export namespace PlatformConfigs {
    export type AdminManagement = z.infer<(typeof platformConfigValidators)[PlatformConfigScope.AdminManagement]>;
    export type System = z.infer<(typeof platformConfigValidators)[PlatformConfigScope.System]>;
}

export type PlatformIpAccessPolicyCheckResult =
  | {
      allowed: false;
      policyId: string;
      reason: PlatformIpAccessPolicyCheckReason.AllowlistMiss | PlatformIpAccessPolicyCheckReason.BlacklistMatch;
  }
  | {
      allowed: false;
      reason: PlatformIpAccessPolicyCheckReason.InvalidIp;
  }
  | {
      allowed: true;
      reason:
        | PlatformIpAccessPolicyCheckReason.Allowed
        | PlatformIpAccessPolicyCheckReason.Disabled
        | PlatformIpAccessPolicyCheckReason.NoApplicablePolicy;
  };

export interface CachedPlatformIpAccessPolicySnapshot {
    enabled: boolean;
    policies: Pick<PlatformIpAccessPolicyData, 'id' | 'ipEntries' | 'mode' | 'targets'>[];
}

export interface CompiledPlatformIpAccessPolicy {
    id: string;
    mode: PlatformIpAccessPolicyMode;
    ranges: { ipv4: IpAddressRange[]; ipv6: IpAddressRange[] };
}

export interface CompiledPlatformIpAccessPolicySnapshot {
    enabled: boolean;
    targetKeyToPlatformIpAccessPoliciesMap: Map<string, CompiledPlatformIpAccessPolicy[]>;
}
