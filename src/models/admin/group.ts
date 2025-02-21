import s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { Schema } from 'mongoose';
import type { Types } from 'mongoose';

import { mongooseRefSchemas } from '@/constants/mongoose';
import type { AdminGroupData } from '@/types/data/admin';

export type AdminGroupDocument = MongooseHydratedDocument<AdminGroup>;
type AdminGroupModel = BaseMongoosePaginateModel<AdminGroup>;

export interface AdminGroup extends BaseMongooseDocType<Except<AdminGroupData, 'createdByAdmin' | 'editedByAdmin' | 'permissions'>> {
    createdByAdmin: Types.ObjectId;
    editedByAdmin?: Types.ObjectId;
    permissions: Types.ObjectId[];
}

const schema = new Schema<AdminGroup, AdminGroupModel>({
    createdByAdmin: mongooseRefSchemas.admin.required,
    editedByAdmin: mongooseRefSchemas.admin.nonRequired,
    name: s.string().maxlength(16).trim.unique.required,
    permissions: {
        default: () => [],
        required: true,
        type: [mongooseRefSchemas.admin.permission.required],
    },
});

schema.virtual(
    'adminCount',
    {
        count: true,
        foreignField: 'group',
        localField: '_id',
        ref: 'Admin',
    },
);

export const AdminGroupModel = buildMongooseModel<AdminGroup, AdminGroupModel>('admin.groups', 'AdminGroup', schema);
