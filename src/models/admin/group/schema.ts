import s from '@kikiutils/mongoose/schema-builders';
import { Schema } from 'mongoose';

import { mongooseRefSchemas } from '@/constants/mongoose';

import type {
    AdminGroup,
    AdminGroupModel,
} from './types';

export const adminGroupSchema = new Schema<AdminGroup, AdminGroupModel>({
    createdByAdmin: mongooseRefSchemas.admin.required,
    editedByAdmin: mongooseRefSchemas.admin.nonRequired,
    name: s.string().maxlength(16).trim.unique.required,
    permissions: {
        default: () => [],
        required: true,
        type: [mongooseRefSchemas.admin.permission.required],
    },
});

adminGroupSchema.virtual(
    'adminCount',
    {
        count: true,
        foreignField: 'group',
        localField: '_id',
        ref: 'Admin',
    },
);
