import { buildMongooseModel } from '@kikiutils/mongoose/utils';

import { adminPermissionSchema } from './schema';
import type {
    AdminPermission,
    AdminPermissionModel,
} from './types';

const model = buildMongooseModel<AdminPermission, AdminPermissionModel>('admin.permissions', 'AdminPermission', adminPermissionSchema);
export { model as AdminPermissionModel };
