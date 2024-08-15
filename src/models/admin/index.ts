import { cryptoSha3256 } from '@kikiutils/node/crypto-hash';
import { Schema } from 'mongoose';
import type { ProjectionType, QueryOptions } from 'mongoose';

import { commonMongooseSchemas } from '../../constants/mongoose';
import type { AdminData } from '../../types/data/admin';
import { buildMongooseModel } from '../../utils/mongoose';

export * from './log';

export type Admin = BaseMongooseDocType<AdminData>;
export type AdminDocument = MongooseHydratedDocument<Admin, AdminMethodsAndOverrides>;

interface AdminMethodsAndOverrides {
	password: string;
	verifyPassword: (password: string) => boolean;
}

interface AdminModel extends BaseMongoosePaginateModel<Admin, AdminMethodsAndOverrides> {
	findByAccount(account: string, projection?: Nullable<ProjectionType<Admin>>, options?: Nullable<QueryOptions<Admin>>): MongooseFindOneReturnType<Admin, AdminDocument>;
}

const adminSchema = new Schema<Admin, AdminModel, AdminMethodsAndOverrides>(
	{
		account: commonMongooseSchemas.string.short.trimmed.unique.required,
		email: { ...commonMongooseSchemas.string.trimmed.nonRequired, lowercase: true },
		enabled: commonMongooseSchemas.boolean.defaultFalse.required,
		name: commonMongooseSchemas.string.short.trimmed.required,
		password: {
			...commonMongooseSchemas.string.private.trimmed.required,
			max: 128,
			min: 128,
			set: (password: string) => cryptoSha3256(password)
		},
		totpSecret: commonMongooseSchemas.string.private.trimmed.nonRequired,
		twoFactorAuthenticationStatus: {
			emailOtp: commonMongooseSchemas.boolean.defaultFalse.required,
			totp: commonMongooseSchemas.boolean.defaultFalse.required
		}
	},
	{
		statics: {
			findByAccount(account: string, projection?: Nullable<ProjectionType<Admin>>, options?: Nullable<QueryOptions<Admin>>) {
				return this.findOne({ account }, projection, options);
			}
		}
	}
);

adminSchema.index({ totpSecret: 1 }, { sparse: true, unique: true });
adminSchema.method('verifyPassword', function (password: string) {
	return cryptoSha3256(password) === this.password;
});

export const AdminModel = buildMongooseModel<Admin, AdminModel, AdminMethodsAndOverrides>('admin.admins', 'Admin', adminSchema);
