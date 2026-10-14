import type { Types } from 'mongoose';

import type { CachedAdminPermission } from '../../types/admin';

import { createProjectRedisKeyedStore } from './_internals';

export const permission = /* @__PURE__ */ createProjectRedisKeyedStore<CachedAdminPermission>()(
    (adminId: string | Types.ObjectId) => `admin:permission:${adminId.toString()}`,
);
