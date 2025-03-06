import s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { cryptoSha3256 } from '@kikiutils/node/crypto-hash';
import { Schema } from 'mongoose';

import type { AdminData } from '@/types/data/admin';

export * from './group';
export * from './log';
export * from './permission';

export type Admin = BaseMongooseDocType<AdminData>;
export type AdminDocument = MongooseHydratedDocument<Admin, AdminMethodsAndOverrides>;
type AdminModel = BaseMongoosePaginateModel<Admin, AdminMethodsAndOverrides>;

export interface AdminMethodsAndOverrides {
    password: string;
    verifyPassword: (password: string) => boolean;
}

const schema = new Schema<Admin, AdminModel, AdminMethodsAndOverrides>({
    account: s.string().maxlength(16).trim.unique.required,
    email: s.string().lowercase.trim.nonRequired,
    enabled: s.boolean().default(false).required,
    name: s.string().maxlength(16).trim.required,
    password: {
        ...s.string().length(64).private.required,
        set: (password: string) => cryptoSha3256(password),
    },
    totpSecret: s.string().private.sparse.trim.unique.nonRequired,
    twoFactorAuthenticationStatus: {
        emailOTP: s.boolean().default(false).required,
        totp: s.boolean().default(false).required,
    },
});

schema.method('verifyPassword', function (password: string) {
    return cryptoSha3256(password) === this.password;
});

export const AdminModel = buildMongooseModel<Admin, AdminModel, AdminMethodsAndOverrides>('admin.admins', 'Admin', schema);
