import * as s from '@kikiutils/mongoose/schema-builders';
import { cryptoSha3256 } from '@kikiutils/node/crypto-hash';
import { Schema } from 'mongoose';

import type {
    Admin,
    AdminMethodsAndOverrides,
    AdminModel,
} from './types';

export const adminSchema = new Schema<Admin, AdminModel, AdminMethodsAndOverrides>({
    account: s.string().maxlength(16).trim.unique.required,
    email: s.string().lowercase.trim.nonRequired,
    enabled: s.boolean().default(false).required,
    name: s.string().maxlength(16).trim.required,
    password: {
        ...s.string().length(64).private.required,
        set: (password: string) => cryptoSha3256(password),
    },
});

adminSchema.method('verifyPassword', function (password: string) {
    return cryptoSha3256(password) === this.password;
});
