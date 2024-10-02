import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { getEnumNumberValues } from '@kikiutils/node/enum';
import { Schema } from 'mongoose';
import type { Types } from 'mongoose';

import { AdminLogType } from '../../constants/admin';
import { commonMongooseSchemas } from '../../constants/mongoose';
import type { AdminLogData } from '../../types/data/admin';

export type AdminLogDocument = MongooseHydratedDocument<AdminLog>;
type AdminLogModel = BaseMongoosePaginateModel<AdminLog>;

export interface AdminLog extends BaseMongooseDocType<Omit<AdminLogData, 'admin'>, true, false> {
	admin: Types.ObjectId;
}

const adminLogSchema = new Schema<AdminLog, AdminLogModel>({
	admin: commonMongooseSchemas.ref.admin.required,
	content: commonMongooseSchemas.string.trimmed.nonRequired,
	fingerprint: commonMongooseSchemas.string.trimmed.nonRequired,
	ip: commonMongooseSchemas.string.trimmed.nonRequired,
	type: { ...commonMongooseSchemas.number.required, enum: getEnumNumberValues(AdminLogType) }
});

adminLogSchema.index({ createdAt: -1 });
export const AdminLogModel = buildMongooseModel<AdminLog, AdminLogModel>('admin.logs', 'AdminLog', adminLogSchema, { timestamps: { createdAt: true, updatedAt: false } });
