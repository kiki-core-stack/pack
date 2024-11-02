import s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { getEnumNumberValues } from '@kikiutils/node/enum';
import { Schema } from 'mongoose';
import type { Types } from 'mongoose';

import { AdminLogType } from '@/constants/admin';
import { mongooseRefSchemas } from '@/constants/mongoose';
import type { AdminLogData } from '@/types/data/admin';

export type AdminLogDocument = MongooseHydratedDocument<AdminLog>;
type AdminLogModel = BaseMongoosePaginateModel<AdminLog>;

export interface AdminLog extends BaseMongooseDocType<Except<AdminLogData, 'admin'>, true, false> {
	admin: Types.ObjectId;
}

const schema = new Schema<AdminLog, AdminLogModel>({
	admin: mongooseRefSchemas.admin.required,
	content: s.string().trim.nonRequired,
	fingerprint: s.string().trim.nonRequired,
	ip: s.string().trim.nonRequired,
	type: s.number().enum(getEnumNumberValues(AdminLogType)).required
});

schema.index({ createdAt: -1 });
export const AdminLogModel = buildMongooseModel<AdminLog, AdminLogModel>('admin.logs', 'AdminLog', schema, { timestamps: { createdAt: true, updatedAt: false } });
