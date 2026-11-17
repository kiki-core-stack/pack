import type {
    PlatformIpAccessPolicyCheckReason,
    PlatformIpAccessPolicyMode,
    PlatformScope,
} from '../constants/platform';
import type { platformConfigVariants } from '../schemas/platform';

import type { IpAddressRange } from './ip';

import type {
    DiscriminatedFieldVariant,
    ZodSchemaMapInput,
    ZodSchemaMapOutput,
} from './';

export type PlatformConfigByScope = ZodSchemaMapOutput<typeof platformConfigVariants['schemas']>;
export type PlatformConfigInputByScope = ZodSchemaMapInput<typeof platformConfigVariants['schemas']>;
export type PlatformConfigVariant<S extends PlatformScope = PlatformScope> = DiscriminatedFieldVariant<
    'scope',
    'config',
    PlatformConfigByScope,
    S
>;

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

/**
 * `PlatformScope.System` 表示所有請求，不可指定帳號。
 * 其他 scope 的 principalIds 為 null 表示該入口的所有請求，指定帳號時必須為非空陣列；
 * 帳號所屬的 model 由 scope 決定（見 model 的 scope 對應表）。
 */
export type PlatformIpAccessPolicyTarget =
  | {
      principalIds: null;
      scope: PlatformScope.System;
  }
  | {
      principalIds: null | string[];
      scope: Exclude<PlatformScope, PlatformScope.System>;
  };

export interface CompiledPlatformIpAccessPolicy {
    id: string;
    mode: PlatformIpAccessPolicyMode;
    ranges: { ipv4: IpAddressRange[]; ipv6: IpAddressRange[] };
}

export interface CompiledPlatformIpAccessPolicySnapshot {
    enabled: boolean;
    targetKeyToPlatformIpAccessPoliciesMap: Map<string, CompiledPlatformIpAccessPolicy[]>;
}
