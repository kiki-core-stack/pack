import type { PlatformConfigScope } from '../../constants/platform';
import type {
    CachedPlatformIpAccessPolicySnapshot,
    PlatformConfigByScope,
} from '../../types/platform';

import { createProjectRedisKeyedStore } from './_internals';

export const config = /* @__PURE__ */ createProjectRedisKeyedStore<PlatformConfigByScope[PlatformConfigScope]>()(
    (scope: PlatformConfigScope) => `platform:config:${scope}`,
);

export const ipAccessPolicySnapshot = /* @__PURE__ */ createProjectRedisKeyedStore<
    CachedPlatformIpAccessPolicySnapshot
>()(
    () => 'platform:ipAccessPolicy:snapshot',
);
