import type { Types } from 'mongoose';

import type { AdminGroupData } from '@/types/data/admin';

export type AdminGroupDocument = MongooseHydratedDocument<AdminGroup>;
export type AdminGroupModel = BaseMongoosePaginateModel<AdminGroup>;

export interface AdminGroup extends BaseMongooseDocType<
    Except<AdminGroupData, 'createdByAdmin' | 'editedByAdmin' | 'permissions'>
> {
    createdByAdmin: Types.ObjectId;
    editedByAdmin?: Types.ObjectId;
    permissions: Types.ObjectId[];
}
