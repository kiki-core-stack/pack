import type { Types } from 'mongoose';

import type { AdminLogData } from '@/types/data/admin';

export type AdminLogDocument = MongooseHydratedDocument<AdminLog>;
export type AdminLogModel = BaseMongoosePaginateModel<AdminLog>;

export interface AdminLog extends BaseMongooseDocType<Except<AdminLogData, 'admin'>, true, false> {
    admin: Types.ObjectId;
}
