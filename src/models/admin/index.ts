import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { cryptoSHA3256 } from '@kikiutils/node/crypto-hash';
import { Schema } from 'mongoose';
import type { ProjectionType, QueryOptions } from 'mongoose';

import { commonMongooseSchemas } from '@/constants/mongoose';
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

const adminSchema = new Schema<Admin, AdminModel, AdminMethodsAndOverrides>({
	account: commonMongooseSchemas.string.short.trimmed.unique.required,
	email: { ...commonMongooseSchemas.string.trimmed.nonRequired, lowercase: true },
	enabled: commonMongooseSchemas.boolean.defaultFalse.required,
	name: commonMongooseSchemas.string.short.trimmed.required,
	password: {
		...commonMongooseSchemas.string.private.trimmed.required,
		max: 128,
		min: 128,
		set: (password: string) => cryptoSHA3256(password)
	},
	totpSecret: {
		...commonMongooseSchemas.string.private.trimmed.nonRequired,
		sparse: true,
		unique: true
	},
	twoFactorAuthenticationStatus: {
		emailOTP: commonMongooseSchemas.boolean.defaultFalse.required,
		totp: commonMongooseSchemas.boolean.defaultFalse.required
	}
});

adminSchema.method('verifyPassword', function (password: string) {
	return cryptoSHA3256(password) === this.password;
});

adminSchema.static('findByAccount', function (account: string, projection?: Nullable<ProjectionType<Admin>>, options?: Nullable<QueryOptions<Admin>>) {
	return this.findOne({ account }, projection, options);
});

export const AdminModel = buildMongooseModel<Admin, AdminModel, AdminMethodsAndOverrides>('admin.admins', 'Admin', adminSchema);
