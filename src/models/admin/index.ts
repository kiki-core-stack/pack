import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { cryptoSha3256 } from '@kikiutils/shared/crypto-hash';
import type { Types } from 'mongoose';
import { Schema } from 'mongoose';
import type { SetFieldType } from 'type-fest';

import * as mongooseRefSchemas from '@/constants/mongoose/ref-schemas';
import type { AdminData } from '@/types/data/admin';

export type Admin = SmartDataToBaseMongooseDocType<SetFieldType<AdminData, 'roles', Types.ObjectId[]>>;
export type AdminDocument = MongooseHydratedDocument<Admin, AdminMethodsAndOverrides>;
type AdminModel = BaseMongoosePaginateModel<Admin, AdminMethodsAndOverrides>;

interface AdminMethodsAndOverrides {
    password: string;
    verifyPassword: (password: string) => boolean;
}

const schema = new Schema<Admin, AdminModel, AdminMethodsAndOverrides>({
    account: s.string().maxlength(16).trim.unique.required,
    email: s.string().lowercase.trim.nonRequired,
    enabled: s.boolean().default(false).required,
    isSuperAdmin: s.boolean().default(false).required,
    password: {
        ...s.string().length(64).private.required,
        set: (password: string) => cryptoSha3256(password),
    },
    roles: {
        default: () => [],
        required: true,
        type: [mongooseRefSchemas.adminRole().required],
    },
});

schema.method(
    'verifyPassword',
    function (password: string) {
        return cryptoSha3256(password) === this.password;
    },
);

export const AdminModel = buildMongooseModel<Admin, AdminModel, AdminMethodsAndOverrides>(
    'admin.admins',
    'Admin',
    schema,
);
