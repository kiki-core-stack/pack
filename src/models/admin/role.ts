import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { Schema } from 'mongoose';

import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import type { AdminRoleData } from '../../types/data/admin';

export type AdminRole = SmartDataToBaseMongooseDocType<AdminRoleData>;
export type AdminRoleDocument = MongooseHydratedDocument<AdminRole>;
type AdminRoleModel = BaseMongoosePaginateModel<AdminRole>;

const schema = new Schema<AdminRole, AdminRoleModel>({
    createdByAdmin: mongooseRefSchemas.admin().required,
    editedByAdmin: mongooseRefSchemas.admin().nonRequired,
    name: s.string().maxlength(16).trim.unique.required,
    permissions: [s.string().trim.required],
});

export const AdminRoleModel = buildMongooseModel<AdminRole, AdminRoleModel>('admin.roles', 'AdminRole', schema);
