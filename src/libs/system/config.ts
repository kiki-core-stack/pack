import type { SystemConfigScope } from '../../constants/system';
import { SystemConfigModel } from '../../models/system/config';
import { systemConfigValidators } from '../../schemas/system/config';
import type { SystemConfigScopeToValuesMap } from '../../types/system';

export async function getSystemConfig<S extends SystemConfigScope>(scope: S): Promise<SystemConfigScopeToValuesMap[S]> {
    const systemConfig = await SystemConfigModel.findOne({ scope }).select('config').lean();
    if (!systemConfig) throw new Error(`System config not found for scope ${scope}`);
    return systemConfigValidators[scope].parse(systemConfig.config);
}
