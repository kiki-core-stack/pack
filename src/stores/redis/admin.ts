import type { Types } from 'mongoose';

import type { PrincipalPermissions } from '../../types/permission';

import { createProjectRedisKeyedStore } from './_internals';

export const permission = /* @__PURE__ */ createProjectRedisKeyedStore<PrincipalPermissions>()(
    (adminId: string | Types.ObjectId) => `admin:permission:${adminId.toString()}`,
);
