import { createRedisKeyedStore } from '@kikiutils/shared/storages/redis/keyed-store';
import type { Except } from 'type-fest';

import { redisMsgpackStorage } from '../../storages/redis/msgpack';
import type { CachedAdminPermission } from '../../types/admin';
import type {
    AdminQrCodeLoginData,
    AdminSessionData,
} from '../../types/data/admin';

export const adminPermission = /* @__PURE__ */ createRedisKeyedStore<CachedAdminPermission>(redisMsgpackStorage)(
    (adminId: string) => `adminPermission:${adminId}`,
);

export const adminQrCodeLoginData = /* @__PURE__ */ createRedisKeyedStore<AdminQrCodeLoginData>(redisMsgpackStorage)(
    (token: string) => `adminQrCodeLoginData:${token}`,
);

// eslint-disable-next-line style/max-len
export const adminSession = /* @__PURE__ */ createRedisKeyedStore<Except<AdminSessionData, 'isCurrent'>>(redisMsgpackStorage)(
    (token: string) => `adminSession:${token}`,
);

export const adminSessionToken = /* @__PURE__ */ createRedisKeyedStore<string>(redisMsgpackStorage)(
    (id: string) => `adminSessionToken:${id}`,
);
