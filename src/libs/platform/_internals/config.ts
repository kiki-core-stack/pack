import type { PlatformConfigScope } from '../../../constants/platform';
import { PlatformConfigModel } from '../../../models/platform/config';
import { platformConfigVariants } from '../../../schemas/platform';
import type { PlatformConfigByScope } from '../../../types/platform';
import { VersionedCache } from '../../redis/versioned-cache';

// Constants/Variables
export const platformConfigCache = new VersionedCache({
    failureTtlSeconds: 3,
    key: (scope: PlatformConfigScope) => scope.toString(),
    load: getUncachedPlatformConfig,
    local: {
        maxAgeSeconds: 60,
        revalidateIntervalSeconds: 1,
    },
    name: 'platform:config',
});

// Functions
/**
 * 直接從資料庫讀取並驗證設定，不經過快取。
 */
export async function getUncachedPlatformConfig<S extends PlatformConfigScope>(scope: S) {
    const platformConfig = await PlatformConfigModel.findOne({ scope }).select('config').lean();
    if (!platformConfig) throw new Error(`Platform config not found for scope ${scope}`);
    return await platformConfigVariants.parse(scope, platformConfig.config) as PlatformConfigByScope[S];
}
