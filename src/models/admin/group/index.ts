import { buildMongooseModel } from '@kikiutils/mongoose/utils';

import { adminGroupSchema } from './schema';
import type {
    AdminGroup,
    AdminGroupModel,
} from './types';

export type * from './types';

const model = buildMongooseModel<AdminGroup, AdminGroupModel>('admin.groups', 'AdminGroup', adminGroupSchema);
export { model as AdminGroupModel };
