import { cloneDeep } from 'es-toolkit';

import { PlatformConfigScope } from '../../constants/platform';
import { PlatformConfigModel } from '../../models/platform/config';
import { platformConfigVariants } from '../../schemas/platform';
import * as lruStore from '../../stores/lru';
import * as redisStore from '../../stores/redis';
import type { PlatformConfigByScope } from '../../types/platform';

// Constants/Variables
const pendingPlatformConfigLoads = new Map<PlatformConfigScope, Promise<PlatformConfigByScope[PlatformConfigScope]>>();

// Functions
export async function clearPlatformConfigCache(scope: PlatformConfigScope) {
    if (scope === PlatformConfigScope.System) lruStore.platform.compiledIpAccessPolicySnapshot.removeItem();

    await Promise.all([
        redisStore.platform.config.removeItem(scope),
        ...scope === PlatformConfigScope.System ? [redisStore.platform.ipAccessPolicySnapshot.removeItem()] : [],
    ]);
}

export async function getPlatformConfig<S extends PlatformConfigScope>(scope: S) {
    let pendingPlatformConfigLoad = pendingPlatformConfigLoads.get(scope);
    if (!pendingPlatformConfigLoad) {
        pendingPlatformConfigLoad = loadPlatformConfig(scope)
            .finally(() => pendingPlatformConfigLoads.delete(scope));

        pendingPlatformConfigLoads.set(scope, pendingPlatformConfigLoad);
    }

    return cloneDeep(await pendingPlatformConfigLoad) as PlatformConfigByScope[S];
}

async function loadPlatformConfig<S extends PlatformConfigScope>(scope: S) {
    const cachedPlatformConfig = await redisStore.platform.config.getItem(scope);
    if (cachedPlatformConfig !== null && cachedPlatformConfig !== undefined) {
        return await platformConfigVariants.parse(scope, cachedPlatformConfig);
    }

    const platformConfig = await PlatformConfigModel.findOne({ scope }).select('config').lean();
    if (!platformConfig) throw new Error(`Platform config not found for scope ${scope}`);
    const config = await platformConfigVariants.parse(scope, platformConfig.config);
    await redisStore.platform.config.setItemWithTtl(60, config, scope);
    return config;
}
