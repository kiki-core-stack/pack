import s from '@kikiutils/mongoose/schema-builders';
import { getEnumNumberValues } from '@kikiutils/node/enum';
import { Schema } from 'mongoose';

import { AdminPermissionMode } from '@/constants/admin';
import { mongooseRefSchemas } from '@/constants/mongoose';

import type {
    AdminPermission,
    AdminPermissionModel,
} from './types';

export const adminPermissionSchema = new Schema<AdminPermission, AdminPermissionModel>({
    createdByAdmin: mongooseRefSchemas.admin.required,
    editedByAdmin: mongooseRefSchemas.admin.nonRequired,
    mode: s.number().default(AdminPermissionMode.Whitelist).enum(getEnumNumberValues(AdminPermissionMode)).required,
    name: s.string().maxlength(16).trim.unique.required,
});
