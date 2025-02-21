import s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { getEnumNumberValues } from '@kikiutils/node/enum';
import { Schema } from 'mongoose';
import type { Types } from 'mongoose';

import { AdminPermissionMode } from '@/constants/admin';
import { mongooseRefSchemas } from '@/constants/mongoose';
import type { AdminPermissionData } from '@/types/data/admin';

export type AdminPermissionDocument = MongooseHydratedDocument<AdminPermission>;
type AdminPermissionModel = BaseMongoosePaginateModel<AdminPermission>;

export interface AdminPermission extends BaseMongooseDocType<Except<AdminPermissionData, 'createdByAdmin' | 'editedByAdmin'>> {
    createdByAdmin: Types.ObjectId;
    editedByAdmin?: Types.ObjectId;
}

const schema = new Schema<AdminPermission, AdminPermissionModel>({
    createdByAdmin: mongooseRefSchemas.admin.required,
    editedByAdmin: mongooseRefSchemas.admin.nonRequired,
    mode: s.number().default(AdminPermissionMode.Whitelist).enum(getEnumNumberValues(AdminPermissionMode)).required,
    name: s.string().maxlength(16).trim.unique.required,
});

export const AdminPermissionModel = buildMongooseModel<AdminPermission, AdminPermissionModel>('admin.permissions', 'AdminPermission', schema);
