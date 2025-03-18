import { buildMongooseModel } from '@kikiutils/mongoose/utils';

import { adminLogSchema } from './schema';
import type {
    AdminLog,
    AdminLogModel,
} from './types';

export type * from './types';

const model = buildMongooseModel<AdminLog, AdminLogModel>('admin.logs', 'AdminLog', adminLogSchema);
export { model as AdminLogModel };
