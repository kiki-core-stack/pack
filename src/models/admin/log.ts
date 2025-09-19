import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { AdminLogType } from '../../constants/admin';
import { schemaTimestampsConfigOnlyCreatedAt } from '../../constants/mongoose';
import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { AdminLogData } from '../../types/data/admin';

export type AdminLog = SmartDataToBaseMongooseDocType<AdminLogData, 'admin'>;
export type AdminLogDocument = MongooseHydratedDocument<AdminLog>;
type AdminLogModel = BaseMongoosePaginateModel<AdminLog>;

const schema = new Schema<AdminLog, AdminLogModel>(
    {
        admin: mongooseRefSchemas.admin().required,
        fingerprint: s.string().trim.nonRequired,
        ip: s.string().trim.nonRequired,
        note: s.string().trim.nonRequired,
        type: s.number().enum(getEnumNumberValues(AdminLogType)).required,
    },
    { timestamps: schemaTimestampsConfigOnlyCreatedAt },
);

export const AdminLogModel = buildMongooseModel<AdminLog, AdminLogModel>('admin.logs', 'AdminLog', schema);
