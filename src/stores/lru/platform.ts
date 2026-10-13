import { createLruKeyedStore } from '@kikiutils/shared/storages/lru/keyed-store';

import { lruCache } from '../../storages/lru';
import type { CompiledPlatformIpAccessPolicySnapshot } from '../../types/platform';

export const compiledIpAccessPolicySnapshot = /* @__PURE__ */ createLruKeyedStore<
    CompiledPlatformIpAccessPolicySnapshot
>(lruCache)(
    () => 'platform:ipAccessPolicy:compiledSnapshot',
);
