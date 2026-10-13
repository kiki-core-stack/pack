import type { PlatformConfigScope } from '../../constants/platform';
import { PlatformConfigModel } from '../../models/platform/config';
import { platformConfigValidators } from '../../schemas/platform/config';
import type { PlatformConfigScopeToValuesMap } from '../../types/platform';

export async function getPlatformConfig<S extends PlatformConfigScope>(scope: S) {
    const platformConfig = await PlatformConfigModel.findOne({ scope }).select('config').lean();
    if (!platformConfig) throw new Error(`Platform config not found for scope ${scope}`);
    return platformConfigValidators[scope].parse(platformConfig.config) as PlatformConfigScopeToValuesMap[S];
}
