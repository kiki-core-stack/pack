import * as s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import type { Types } from 'mongoose';
import { Schema } from 'mongoose';

import { AdminLogType } from '../../constants/admin';
import {
    mongooseRefSchemas,
    schemaTimestampsConfigOnlyCreatedAt,
} from '../../constants/mongoose';
import type { AdminLogData } from '../../types/data/admin';

export type AdminLogDocument = MongooseHydratedDocument<AdminLog>;
type AdminLogModel = BaseMongoosePaginateModel<AdminLog>;

export interface AdminLog extends BaseMongooseDocType<Except<AdminLogData, 'admin'>, true, false> {
    admin: Types.ObjectId;
}

const schema = new Schema<AdminLog, AdminLogModel>(
    {
        admin: mongooseRefSchemas.admin.required,
        fingerprint: s.string().trim.nonRequired,
        ip: s.string().trim.nonRequired,
        note: s.string().trim.nonRequired,
        type: s.number().enum(getEnumNumberValues(AdminLogType)).required,
    },
    { timestamps: schemaTimestampsConfigOnlyCreatedAt },
);

export const AdminLogModel = buildMongooseModel<AdminLog, AdminLogModel>('admin.logs', 'AdminLog', schema);
