import { createRedisKeyedStore } from '@kikiutils/shared/storages/redis/keyed-store';

import { redisMsgpackStorage } from '../../storages/redis/msgpack';
import type { CachedAdminPermission } from '../../types/admin';

export const adminPermission = /* @__PURE__ */ createRedisKeyedStore<CachedAdminPermission>(redisMsgpackStorage)(
    (adminId: string) => `adminPermission:${adminId}`,
);
