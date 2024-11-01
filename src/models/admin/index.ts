import s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { cryptoSHA3256 } from '@kikiutils/node/crypto-hash';
import { Schema } from 'mongoose';
import type { ProjectionType, QueryOptions } from 'mongoose';

import type { AdminData } from '@/types/data/admin';

export * from './log';

export type Admin = BaseMongooseDocType<AdminData>;
export type AdminDocument = MongooseHydratedDocument<Admin, AdminMethodsAndOverrides>;

export interface AdminMethodsAndOverrides {
	password: string;
	verifyPassword: (password: string) => boolean;
}

interface AdminModel extends BaseMongoosePaginateModel<Admin, AdminMethodsAndOverrides> {
	findByAccount(account: string, projection?: Nullable<ProjectionType<Admin>>, options?: Nullable<QueryOptions<Admin>>): MongooseFindOneReturnType<Admin, AdminDocument, {}, AdminMethodsAndOverrides>;
}

const schema = new Schema<Admin, AdminModel, AdminMethodsAndOverrides>({
	account: s.string().maxlength(16).trim.unique.required,
	email: s.string().lowercase.trim.nonRequired,
	enabled: s.boolean().default(false).required,
	name: s.string().maxlength(16).trim.required,
	password: { ...s.string().length(64).private.required, set: (password: string) => cryptoSHA3256(password) },
	totpSecret: s.string().private.sparse.trim.unique.nonRequired,
	twoFactorAuthenticationStatus: {
		emailOTP: s.boolean().default(false).required,
		totp: s.boolean().default(false).required
	}
});

schema.method('verifyPassword', function (password: string) {
	return cryptoSHA3256(password) === this.password;
});

schema.static('findByAccount', function (account: string, projection?: Nullable<ProjectionType<Admin>>, options?: Nullable<QueryOptions<Admin>>) {
	return this.findOne({ account }, projection, options);
});

export const AdminModel = buildMongooseModel<Admin, AdminModel, AdminMethodsAndOverrides>('admin.admins', 'Admin', schema);
