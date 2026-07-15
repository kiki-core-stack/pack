import { createRedisKeyedStore } from '@kikiutils/shared/storages/redis/keyed-store';

import { redisMsgpackStorage } from '../../storages/redis/msgpack';
import type { CachedAdminPermission } from '../../types/admin';
import type { AdminQrCodeLoginData } from '../../types/data/admin';

export const adminPermission = /* @__PURE__ */ createRedisKeyedStore<CachedAdminPermission>(redisMsgpackStorage)(
    (adminId: string) => `adminPermission:${adminId}`,
);

export const adminQrCodeLoginData = /* @__PURE__ */ createRedisKeyedStore<AdminQrCodeLoginData>(redisMsgpackStorage)(
    (token: string) => `adminQrCodeLoginData:${token}`,
);
