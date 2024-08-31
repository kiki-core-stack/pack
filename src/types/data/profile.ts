export interface ProfileSecurityChangePasswordFormData extends TwoFactorAuthenticationCodesData {
	conformPassword: string;
	oldPassword: string;
	newPassword: string;
}

export interface ProfileSecurityTotpSecretData {
	secret: string;
	url: string;
}
