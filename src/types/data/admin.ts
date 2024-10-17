import type { AdminLogType } from '@/constants/admin';

export interface AdminData extends BaseMongooseModelData {
	account: string;
	email?: string;
	enabled: boolean;
	name: string;
	password?: string;
	totpSecret?: string;
	twoFactorAuthenticationStatus: TwoFactorAuthenticationStatus;
}

export interface AdminLogData extends BaseMongooseModelData<true, false> {
	admin: Partial<AdminData>;
	content?: string;
	fingerprint?: string;
	ip?: string;
	type: AdminLogType;
}

export interface AdminLoginFormData extends TwoFactorAuthenticationCodesData {
	account: string;
	password: string;
	verCode: string;
}
