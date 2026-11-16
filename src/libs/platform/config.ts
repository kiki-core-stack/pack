import { cloneDeep } from 'es-toolkit';

import type { PlatformConfigScope } from '../../constants/platform';
import type { PlatformConfigByScope } from '../../types/platform';

import { platformConfigCache } from './_internals/config';

// Functions
export async function clearPlatformConfigCache(scope: PlatformConfigScope) {
    await platformConfigCache.invalidate(scope);
}

export async function getPlatformConfig<S extends PlatformConfigScope>(scope: S) {
    return cloneDeep(await platformConfigCache.get(scope)) as PlatformConfigByScope[S];
}
