import type { CachedAdminPermission } from '../../types/admin';

import { createProjectRedisKeyedStore } from './_internals';

export const permission = /* @__PURE__ */ createProjectRedisKeyedStore<CachedAdminPermission>()(
    (adminId: string) => `admin:permission:${adminId}`,
);
