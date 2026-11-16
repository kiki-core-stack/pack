import { isIP } from 'node:net';

import ipaddr from 'ipaddr.js';

import {
    PlatformConfigScope,
    PlatformIpAccessPolicyCheckReason,
    PlatformIpAccessPolicyMode,
} from '../../constants/platform';
import type { PlatformIpAccessPolicyScope } from '../../constants/platform';
import { PlatformIpAccessPolicyModel } from '../../models/platform/ip-access-policy';
import type { AuthenticationSessionPrincipalType } from '../../types/authentication-session';
import type { IpAddressRange } from '../../types/ip';
import type {
    CompiledPlatformIpAccessPolicy,
    CompiledPlatformIpAccessPolicySnapshot,
    PlatformIpAccessPolicyCheckResult,
} from '../../types/platform';
import { VersionedCache } from '../redis/versioned-cache';

import {
    getUncachedPlatformConfig,
    platformConfigCache,
} from './_internals/config';

// Constants/Variables
const globalPlatformIpAccessPolicyTargetKey = 'global';
const ipv4MappedIpv6AddressRange: IpAddressRange = {
    end: 0xFFFFFFFFFFFFn,
    start: 0xFFFF00000000n,
};

/**
 * 規則開關存在 System 設定中，因此依賴該設定的版本號。
 */
const platformIpAccessPolicySnapshotCache = new VersionedCache({
    dependsOn: [platformConfigCache.asDependency(PlatformConfigScope.System)],
    failureTtlSeconds: 3,
    load: loadCompiledPlatformIpAccessPolicySnapshot,
    local: {
        maxAgeSeconds: 60,
        revalidateIntervalSeconds: 1,
    },
    name: 'platform:ipAccessPolicy:snapshot',
});

// Functions
/**
 * 檢查所有適用且啟用的IP存取規則；任一黑名單命中或白名單未命中即拒絕。
 * scope／principalType 由呼叫端的路由提供，principalId 必須來自已驗證的身分。
 * 未提供 principalId 時不匹配指定帳號規則；身分識別後須再檢查。
 * 規則載入／快取操作失敗會拋錯（失敗結果會短暫快取），HTTP 回應由呼叫端決定。
 */
export async function checkPlatformIpAccessPolicy(
    ip: null | string | undefined,
    scope?: PlatformIpAccessPolicyScope,
    principalType?: AuthenticationSessionPrincipalType,
    principalId?: string,
): Promise<PlatformIpAccessPolicyCheckResult> {
    if (principalType !== undefined && scope === undefined) {
        throw new Error('A principal type requires an IP access policy scope');
    }

    if (principalId !== undefined && principalType === undefined) {
        throw new Error('A principal ID requires a principal type');
    }

    const snapshot = await platformIpAccessPolicySnapshotCache.get();
    if (!snapshot.enabled) {
        return {
            allowed: true,
            reason: PlatformIpAccessPolicyCheckReason.Disabled,
        };
    }

    const targetKeys = [globalPlatformIpAccessPolicyTargetKey];
    if (scope !== undefined) {
        targetKeys.push(getPlatformIpAccessPolicyTargetKey(scope));
        if (principalType !== undefined) {
            targetKeys.push(getPlatformIpAccessPolicyTargetKey(scope, principalType));
            if (principalId !== undefined) {
                targetKeys.push(getPlatformIpAccessPolicyTargetKey(scope, principalType, principalId));
            }
        }
    }

    const applicablePolicies = new Set<CompiledPlatformIpAccessPolicy>();
    for (const key of targetKeys) {
        for (const policy of snapshot.targetKeyToPlatformIpAccessPoliciesMap.get(key) ?? []) {
            applicablePolicies.add(policy);
        }
    }

    if (!applicablePolicies.size) {
        return {
            allowed: true,
            reason: PlatformIpAccessPolicyCheckReason.NoApplicablePolicy,
        };
    }

    const address = parseIpAddress(ip);
    if (!address) {
        return {
            allowed: false,
            reason: PlatformIpAccessPolicyCheckReason.InvalidIp,
        };
    }

    const value = getIpAddressValue(address);
    const version = address.kind();
    for (const policy of applicablePolicies) {
        const matches = matchesIpAddressRanges(value, policy.ranges[version]);
        if (policy.mode === PlatformIpAccessPolicyMode.Blacklist) {
            if (matches) {
                return {
                    allowed: false,
                    policyId: policy.id,
                    reason: PlatformIpAccessPolicyCheckReason.BlacklistMatch,
                };
            }
        } else if (!matches) {
            return {
                allowed: false,
                policyId: policy.id,
                reason: PlatformIpAccessPolicyCheckReason.AllowlistMiss,
            };
        }
    }

    return {
        allowed: true,
        reason: PlatformIpAccessPolicyCheckReason.Allowed,
    };
}

/**
 * 其他實例最多約 1 秒後套用。
 */
export async function clearPlatformIpAccessPolicyCache() {
    await platformIpAccessPolicySnapshotCache.invalidate();
}

function getIpAddressValue(address: ipaddr.IPv4 | ipaddr.IPv6) {
    let value = 0n;
    for (const byte of address.toByteArray()) value = value << 8n | BigInt(byte);
    return value;
}

function getPlatformIpAccessPolicyTargetKey(
    scope: PlatformIpAccessPolicyScope,
    principalType?: AuthenticationSessionPrincipalType,
    principalId?: string,
) {
    if (principalType === undefined) return `${scope}`;
    if (principalId === undefined) return `${scope}:${principalType}`;
    return `${scope}:${principalType}:${principalId}`;
}

/**
 * 直接讀取資料庫中的 System 設定，避免拿到本機尚未重新確認的設定快取。
 */
async function loadCompiledPlatformIpAccessPolicySnapshot(): Promise<CompiledPlatformIpAccessPolicySnapshot> {
    const targetKeyToPlatformIpAccessPoliciesMap = new Map<string, CompiledPlatformIpAccessPolicy[]>();
    const platformConfig = await getUncachedPlatformConfig(PlatformConfigScope.System);
    if (!platformConfig.ipAccessPolicy.enabled) {
        return {
            enabled: false,
            targetKeyToPlatformIpAccessPoliciesMap,
        };
    }

    const policies = await PlatformIpAccessPolicyModel
        .find({ enabled: true })
        .select('_id ipEntries mode targets')
        .lean();

    for (const policy of policies) {
        const id = policy._id.toHexString();
        if (!policy.ipEntries.length || !policy.targets.length) {
            throw new Error(`IP access policy ${id} requires IP entries and targets`);
        }

        const ranges: CompiledPlatformIpAccessPolicy['ranges'] = {
            ipv4: [],
            ipv6: [],
        };

        for (const entry of policy.ipEntries) {
            const [address, prefix] = entry.includes('/')
                ? ipaddr.parseCIDR(entry)
                : [
                    ipaddr.parse(entry),
                    entry.includes(':') ? 128 : 32,
                ] as const;

            const version = address.kind();
            const hostBits = BigInt((version === 'ipv4' ? 32 : 128) - prefix);
            const start = getIpAddressValue(address) >> hostBits << hostBits;
            const end = start + (1n << hostBits) - 1n;
            ranges[version].push({
                end,
                start,
            });

            // 檢查時 IPv4-mapped IPv6 位址會轉為 IPv4，因此將 IPv6 區間與 IPv4-mapped 區段的交集另存為 IPv4 區間。
            if (version === 'ipv6' && start <= ipv4MappedIpv6AddressRange.end && end >= ipv4MappedIpv6AddressRange.start) {
                const mappedStart = start > ipv4MappedIpv6AddressRange.start ? start : ipv4MappedIpv6AddressRange.start;
                const mappedEnd = end < ipv4MappedIpv6AddressRange.end ? end : ipv4MappedIpv6AddressRange.end;
                ranges.ipv4.push({
                    end: mappedEnd - ipv4MappedIpv6AddressRange.start,
                    start: mappedStart - ipv4MappedIpv6AddressRange.start,
                });
            }
        }

        const compiledPolicy: CompiledPlatformIpAccessPolicy = {
            id,
            mode: policy.mode,
            ranges: {
                ipv4: mergeIpAddressRanges(ranges.ipv4),
                ipv6: mergeIpAddressRanges(ranges.ipv6),
            },
        };

        const targetKeys = new Set<string>();
        for (const {
            principalIds,
            principalType,
            scope,
        } of policy.targets) {
            if (scope === null) targetKeys.add(globalPlatformIpAccessPolicyTargetKey);
            else if (principalType === null) targetKeys.add(getPlatformIpAccessPolicyTargetKey(scope));
            else if (principalIds === null) targetKeys.add(getPlatformIpAccessPolicyTargetKey(scope, principalType));
            else {
                if (!principalIds.length) throw new Error(`Empty principal IDs in IP access policy ${id}`);
                for (const principalId of principalIds) {
                    targetKeys.add(getPlatformIpAccessPolicyTargetKey(scope, principalType, principalId.toHexString()));
                }
            }
        }

        for (const key of targetKeys) {
            const targetPolicies = targetKeyToPlatformIpAccessPoliciesMap.get(key);
            if (targetPolicies) targetPolicies.push(compiledPolicy);
            else targetKeyToPlatformIpAccessPoliciesMap.set(key, [compiledPolicy]);
        }
    }

    return {
        enabled: true,
        targetKeyToPlatformIpAccessPoliciesMap,
    };
}

function matchesIpAddressRanges(value: bigint, ranges: readonly IpAddressRange[]) {
    let low = 0;
    let high = ranges.length - 1;
    while (low <= high) {
        const middle = (low + high) >>> 1;
        const range = ranges[middle]!;
        if (value < range.start) high = middle - 1;
        else if (value > range.end) low = middle + 1;
        else return true;
    }

    return false;
}

function mergeIpAddressRanges(ranges: IpAddressRange[]) {
    ranges.sort((left, right) => left.start < right.start ? -1 : left.start > right.start ? 1 : 0);
    const merged: IpAddressRange[] = [];
    for (const range of ranges) {
        const previous = merged.at(-1);
        if (previous && range.start <= previous.end + 1n) {
            if (range.end > previous.end) previous.end = range.end;
        } else merged.push(range);
    }

    return merged;
}

/**
 * 僅接受標準寫法（node:net 的嚴格檢查），拒絕帶 zone ID 的 IPv6；IPv4-mapped IPv6 會轉為 IPv4。
 */
function parseIpAddress(ip: null | string | undefined) {
    if (!ip) return;
    switch (isIP(ip)) {
        case 4: return ipaddr.IPv4.parse(ip);
        case 6: return ip.includes('%') ? undefined : ipaddr.process(ip);
    }
}
