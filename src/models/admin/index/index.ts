import { buildMongooseModel } from '@kikiutils/mongoose/utils';

import { adminSchema } from './schema';
import type {
    Admin,
    AdminMethodsAndOverrides,
    AdminModel,
} from './types';

const model = buildMongooseModel<Admin, AdminModel, AdminMethodsAndOverrides>('admin.admins', 'Admin', adminSchema);
export { model as AdminModel };
