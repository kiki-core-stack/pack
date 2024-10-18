export interface ProfileSecurityChangePasswordFormData extends TwoFactorAuthenticationCodesData {
	conformPassword: string;
	oldPassword: string;
	newPassword: string;
}

export interface ProfileSecurityTOTPSecretData {
	secret: string;
	url: string;
}
