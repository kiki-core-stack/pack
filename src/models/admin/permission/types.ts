import type { Types } from 'mongoose';

import type { AdminPermissionData } from '../../../types/data/admin';

export type AdminPermissionDocument = MongooseHydratedDocument<AdminPermission>;
export type AdminPermissionModel = BaseMongoosePaginateModel<AdminPermission>;

export interface AdminPermission extends BaseMongooseDocType<
    Except<AdminPermissionData, 'createdByAdmin' | 'editedByAdmin'>
> {
    createdByAdmin: Types.ObjectId;
    editedByAdmin?: Types.ObjectId;
}
