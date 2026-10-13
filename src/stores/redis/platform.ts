import type { CachedPlatformIpAccessPolicySnapshot } from '../../types/platform';

import { createProjectRedisKeyedStore } from './_internals';

export const ipAccessPolicySnapshot = /* @__PURE__ */ createProjectRedisKeyedStore<
    CachedPlatformIpAccessPolicySnapshot
>()(
    () => 'platform:ipAccessPolicy:snapshot',
);
