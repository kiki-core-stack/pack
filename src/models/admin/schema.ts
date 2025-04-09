import {
    boolean,
    string,
} from '@kikiutils/mongoose/schema-builders';
import { cryptoSha3256 } from '@kikiutils/node/crypto-hash';
import { Schema } from 'mongoose';

import type {
    Admin,
    AdminMethodsAndOverrides,
    AdminModel,
} from './types';

export const adminSchema = new Schema<Admin, AdminModel, AdminMethodsAndOverrides>({
    account: string().maxlength(16).trim.unique.required,
    email: string().lowercase.trim.nonRequired,
    enabled: boolean().default(false).required,
    name: string().maxlength(16).trim.required,
    password: {
        ...string().length(64).private.required,
        set: (password: string) => cryptoSha3256(password),
    },
});

adminSchema.method('verifyPassword', function (password: string) {
    return cryptoSha3256(password) === this.password;
});
