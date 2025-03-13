import { buildMongooseModel } from '@kikiutils/mongoose/utils';

import { adminLogSchema } from './schema';
import type {
    AdminLog,
    AdminLogModel,
} from './types';

const model = buildMongooseModel<AdminLog, AdminLogModel>(
    'admin.logs',
    'AdminLog',
    adminLogSchema,
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    },
);

export { model as AdminLogModel };
