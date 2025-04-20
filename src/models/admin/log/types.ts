import type { Types } from 'mongoose';

import type { AdminLogData } from '../../../types/data/admin';

export type AdminLogDocument = MongooseHydratedDocument<AdminLog>;
export type AdminLogModel = BaseMongoosePaginateModel<AdminLog>;

export interface AdminLog extends BaseMongooseDocType<Except<AdminLogData, 'a'>, true, false> {
    a: Types.ObjectId;
}
