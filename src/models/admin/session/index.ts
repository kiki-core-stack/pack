import { buildMongooseModel } from '@kikiutils/mongoose/utils';

import { adminSessionSchema } from './schema';
import type {
    AdminSession,
    AdminSessionModel,
} from './types';

export type * from './types';

const model = buildMongooseModel<AdminSession, AdminSessionModel>('admin.sessions', 'AdminSession', adminSessionSchema);
export { model as AdminSessionModel };
