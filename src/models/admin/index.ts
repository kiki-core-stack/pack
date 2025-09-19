import type { Buffer } from 'node:buffer';

import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import type { Types } from 'mongoose';
import { Schema } from 'mongoose';
import type { SetFieldType } from 'type-fest';

import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import { argon2VerifyPassword } from '../../libs/password-argon2';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { AdminData } from '../../types/data/admin';

export type Admin = SmartDataToBaseMongooseDocType<SetFieldType<AdminData, 'roles', Types.ObjectId[]>>;
export type AdminDocument = MongooseHydratedDocument<Admin, AdminMethodsAndOverrides>;
type AdminModel = BaseMongoosePaginateModel<Admin, AdminMethodsAndOverrides>;

interface AdminMethodsAndOverrides {
    password: string;
    verifyPassword: (password: string, options?: { secret: Buffer }) => Promise<boolean>;
}

const schema = new Schema<Admin, AdminModel, AdminMethodsAndOverrides>({
    account: s.string().maxlength(16).trim.unique.required,
    email: s.string().lowercase.trim.nonRequired,
    enabled: s.boolean().default(false).required,
    isSuperAdmin: s.boolean().default(false).required,
    password: s.string().private.required,
    roles: {
        default: () => [],
        required: true,
        type: [mongooseRefSchemas.adminRole().required],
    },
});

schema.method(
    'verifyPassword',
    function (password: string, options?: { secret: Buffer }) {
        return argon2VerifyPassword(this.password, password, options);
    },
);

export const AdminModel = buildMongooseModel<Admin, AdminModel, AdminMethodsAndOverrides>(
    'admin.admins',
    'Admin',
    schema,
);
