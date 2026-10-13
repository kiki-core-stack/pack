import ipaddr from 'ipaddr.js';
import * as z from 'zod';

import {
    PlatformConfigScope,
    PlatformIpAccessPolicyCheckReason,
    PlatformIpAccessPolicyMode,
} from '../../constants/platform';
import type { PlatformIpAccessPolicyScope } from '../../constants/platform';
import { PlatformIpAccessPolicyModel } from '../../models/platform/ip-access-policy';
import * as lruStore from '../../stores/lru';
import * as redisStore from '../../stores/redis';
import type { AuthenticationSessionPrincipalType } from '../../types/authentication-session';
import type { IpAddressRange } from '../../types/ip';
import type {
    CachedPlatformIpAccessPolicySnapshot,
    CompiledPlatformIpAccessPolicy,
    CompiledPlatformIpAccessPolicySnapshot,
    PlatformIpAccessPolicyCheckResult,
    PlatformIpAccessPolicyTarget,
} from '../../types/platform';

import { getPlatformConfig } from './config';

const ipAddressSchema = z.string().trim().pipe(z.union([
    z.ipv4(),
    z.ipv6(),
]));

const ipv4MappedIpv6AddressRange: IpAddressRange = {
    end: 0xFFFFFFFFFFFFn,
    start: 0xFFFF00000000n,
};

let pendingCompiledPlatformIpAccessPolicySnapshotLoad: Promise<CompiledPlatformIpAccessPolicySnapshot> | undefined;

/**
 * 檢查所有適用且啟用的IP存取規則；任一黑名單命中或白名單未命中即拒絕。
 * scope／principalType 由呼叫端的路由提供，principalId 必須來自已驗證的身分。
 * 未提供 principalId 時不匹配指定帳號規則；身分識別後須再檢查。
 * 規則載入／快取操作失敗會拋錯，HTTP 回應由呼叫端決定。
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

    const platformIpAccessPolicySnapshot = await getCompiledPlatformIpAccessPolicySnapshot();
    if (!platformIpAccessPolicySnapshot.enabled) {
        return {
            allowed: true,
            reason: PlatformIpAccessPolicyCheckReason.Disabled,
        };
    }

    const targetKeys = [getPlatformIpAccessPolicyTargetKey(null)];
    if (scope !== undefined) {
        targetKeys.push(getPlatformIpAccessPolicyTargetKey(scope));
        if (principalType !== undefined) {
            targetKeys.push(getPlatformIpAccessPolicyTargetKey(scope, principalType));
            if (principalId !== undefined) {
                targetKeys.push(getPlatformIpAccessPolicyTargetKey(
                    scope,
                    principalType,
                    principalId,
                ));
            }
        }
    }

    const applicablePlatformIpAccessPolicies = new Set<CompiledPlatformIpAccessPolicy>();
    for (const key of targetKeys) {
        const targetPlatformIpAccessPolicies = platformIpAccessPolicySnapshot
            .targetKeyToPlatformIpAccessPoliciesMap
            .get(key);

        for (const platformIpAccessPolicy of targetPlatformIpAccessPolicies ?? []) {
            applicablePlatformIpAccessPolicies.add(platformIpAccessPolicy);
        }
    }

    if (!applicablePlatformIpAccessPolicies.size) {
        return {
            allowed: true,
            reason: PlatformIpAccessPolicyCheckReason.NoApplicablePolicy,
        };
    }

    const parsedIp = ipAddressSchema.safeParse(ip);
    if (!parsedIp.success) {
        return {
            allowed: false,
            reason: PlatformIpAccessPolicyCheckReason.InvalidIp,
        };
    }

    const address = ipaddr.process(parsedIp.data);
    const value = getIpAddressValue(address);
    const version = address.kind();
    for (const platformIpAccessPolicy of applicablePlatformIpAccessPolicies) {
        const matches = matchesIpAddressRanges(value, platformIpAccessPolicy.ranges[version]);
        const isBlacklist = platformIpAccessPolicy.mode === PlatformIpAccessPolicyMode.Blacklist;
        if (isBlacklist ? matches : !matches) {
            return {
                allowed: false,
                policyId: platformIpAccessPolicy.id,
                reason: isBlacklist
                    ? PlatformIpAccessPolicyCheckReason.BlacklistMatch
                    : PlatformIpAccessPolicyCheckReason.AllowlistMiss,
            };
        }
    }

    return {
        allowed: true,
        reason: PlatformIpAccessPolicyCheckReason.Allowed,
    };
}

function compilePlatformIpAccessPolicySnapshot(
    platformIpAccessPolicySnapshot: CachedPlatformIpAccessPolicySnapshot,
): CompiledPlatformIpAccessPolicySnapshot {
    const targetKeyToPlatformIpAccessPoliciesMap = new Map<string, CompiledPlatformIpAccessPolicy[]>();
    if (!platformIpAccessPolicySnapshot.enabled) {
        return {
            enabled: false,
            targetKeyToPlatformIpAccessPoliciesMap,
        };
    }

    for (const platformIpAccessPolicy of platformIpAccessPolicySnapshot.policies) {
        if (
            platformIpAccessPolicy.mode !== PlatformIpAccessPolicyMode.Allowlist
            && platformIpAccessPolicy.mode !== PlatformIpAccessPolicyMode.Blacklist
        ) throw new Error(`Invalid IP access policy mode: ${platformIpAccessPolicy.mode}`);

        if (!platformIpAccessPolicy.ipEntries.length || !platformIpAccessPolicy.targets.length) {
            throw new Error(`IP access policy ${platformIpAccessPolicy.id} requires IP entries and targets`);
        }

        const compiledPlatformIpAccessPolicy: CompiledPlatformIpAccessPolicy = {
            id: platformIpAccessPolicy.id,
            mode: platformIpAccessPolicy.mode,
            ranges: {
                ipv4: [],
                ipv6: [],
            },
        };

        for (const entry of platformIpAccessPolicy.ipEntries) {
            const normalizedEntry = entry.trim();
            const [address, prefix] = normalizedEntry.includes('/')
                ? ipaddr.parseCIDR(normalizedEntry)
                : [
                    ipaddr.parse(normalizedEntry),
                    normalizedEntry.includes(':') ? 128 : 32,
                ] as const;

            const version = address.kind();
            const hostBits = BigInt((version === 'ipv4' ? 32 : 128) - prefix);
            const start = getIpAddressValue(address) >> hostBits << hostBits;
            const end = start + (1n << hostBits) - 1n;
            compiledPlatformIpAccessPolicy.ranges[version].push({
                end,
                start,
            });

            // 保留原 IPv6 區間，並將與 IPv4-mapped 區段的交集映射為 IPv4 區間。
            if (
                version === 'ipv6'
                && start <= ipv4MappedIpv6AddressRange.end
                && end >= ipv4MappedIpv6AddressRange.start
            ) {
                compiledPlatformIpAccessPolicy.ranges.ipv4.push({
                    end: (end < ipv4MappedIpv6AddressRange.end ? end : ipv4MappedIpv6AddressRange.end)
                      - ipv4MappedIpv6AddressRange.start,
                    start: (start > ipv4MappedIpv6AddressRange.start ? start : ipv4MappedIpv6AddressRange.start)
                      - ipv4MappedIpv6AddressRange.start,
                });
            }
        }

        compiledPlatformIpAccessPolicy.ranges.ipv4 = mergeIpAddressRanges(compiledPlatformIpAccessPolicy.ranges.ipv4);
        compiledPlatformIpAccessPolicy.ranges.ipv6 = mergeIpAddressRanges(compiledPlatformIpAccessPolicy.ranges.ipv6);
        const targetKeys = new Set<string>();
        for (const {
            principalIds,
            principalType,
            scope,
        } of platformIpAccessPolicy.targets) {
            if (scope === null) targetKeys.add(getPlatformIpAccessPolicyTargetKey(null));
            else if (principalType === null) targetKeys.add(getPlatformIpAccessPolicyTargetKey(scope));
            else if (principalIds === null) targetKeys.add(getPlatformIpAccessPolicyTargetKey(scope, principalType));
            else {
                if (!principalIds.length) {
                    throw new Error(`Empty principal IDs in IP access policy ${platformIpAccessPolicy.id}`);
                }

                for (const principalId of principalIds) {
                    targetKeys.add(getPlatformIpAccessPolicyTargetKey(scope, principalType, principalId));
                }
            }
        }

        for (const key of targetKeys) {
            let targetPlatformIpAccessPolicies = targetKeyToPlatformIpAccessPoliciesMap.get(key);
            if (!targetPlatformIpAccessPolicies) {
                targetKeyToPlatformIpAccessPoliciesMap.set(key, targetPlatformIpAccessPolicies = []);
            }

            targetPlatformIpAccessPolicies.push(compiledPlatformIpAccessPolicy);
        }
    }

    return {
        enabled: true,
        targetKeyToPlatformIpAccessPoliciesMap,
    };
}

function getCompiledPlatformIpAccessPolicySnapshot() {
    const cachedCompiledPlatformIpAccessPolicySnapshot = lruStore.platform.compiledIpAccessPolicySnapshot.getItem();

    if (cachedCompiledPlatformIpAccessPolicySnapshot) return cachedCompiledPlatformIpAccessPolicySnapshot;
    if (!pendingCompiledPlatformIpAccessPolicySnapshotLoad) {
        pendingCompiledPlatformIpAccessPolicySnapshotLoad = loadCompiledPlatformIpAccessPolicySnapshot()
            .then((platformIpAccessPolicySnapshot) => {
                lruStore.platform.compiledIpAccessPolicySnapshot.setItemWithTtl(15000, platformIpAccessPolicySnapshot);

                return platformIpAccessPolicySnapshot;
            })
            .finally(() => pendingCompiledPlatformIpAccessPolicySnapshotLoad = undefined);
    }

    return pendingCompiledPlatformIpAccessPolicySnapshotLoad;
}

function getIpAddressValue(address: ipaddr.IPv4 | ipaddr.IPv6) {
    let value = 0n;
    for (const byte of address.toByteArray()) value = value << 8n | BigInt(byte);
    return value;
}

function getPlatformIpAccessPolicyTargetKey(
    scope: PlatformIpAccessPolicyTarget['scope'],
    principalType?: PlatformIpAccessPolicyTarget['principalType'],
    principalId?: string,
) {
    if (scope === null) return 'global';
    const target = [
        scope,
        principalType,
        principalId,
    ];

    return JSON.stringify(target.slice(0, principalType === undefined ? 1 : principalId === undefined ? 2 : 3));
}

async function loadCompiledPlatformIpAccessPolicySnapshot() {
    let platformIpAccessPolicySnapshot = await redisStore.platform.ipAccessPolicySnapshot.getItem();
    if (platformIpAccessPolicySnapshot !== null && platformIpAccessPolicySnapshot !== undefined) {
        return compilePlatformIpAccessPolicySnapshot(platformIpAccessPolicySnapshot);
    }

    const platformConfig = await getPlatformConfig(PlatformConfigScope.System);
    platformIpAccessPolicySnapshot = {
        enabled: platformConfig.ipAccessPolicy.enabled,
        policies: [],
    };

    if (platformIpAccessPolicySnapshot.enabled) {
        const platformIpAccessPolicies = await PlatformIpAccessPolicyModel
            .find({ enabled: true })
            .select('_id ipEntries mode targets')
            .lean();

        platformIpAccessPolicySnapshot.policies = platformIpAccessPolicies.map((platformIpAccessPolicy) => ({
            id: platformIpAccessPolicy._id.toHexString(),
            ipEntries: platformIpAccessPolicy.ipEntries,
            mode: platformIpAccessPolicy.mode,
            targets: platformIpAccessPolicy.targets.map((target) => ({
                principalIds: target.principalIds?.map((id) => id.toHexString()) ?? null,
                principalType: target.principalType,
                scope: target.scope,
            })) as PlatformIpAccessPolicyTarget[],
        }));
    }

    const compiledPlatformIpAccessPolicySnapshot = compilePlatformIpAccessPolicySnapshot(
        platformIpAccessPolicySnapshot,
    );

    await redisStore.platform.ipAccessPolicySnapshot.setItemWithTtl(60, platformIpAccessPolicySnapshot);

    return compiledPlatformIpAccessPolicySnapshot;
}

function matchesIpAddressRanges(value: bigint, ranges: readonly IpAddressRange[]) {
    let low = 0;
    let high = ranges.length - 1;
    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
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
