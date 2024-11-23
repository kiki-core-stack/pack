export interface ProfileSecurityChangePasswordFormData extends TwoFactorAuthenticationCodesData {
    conformPassword: string;
    newPassword: string;
    oldPassword: string;
}

export interface ProfileSecurityTOTPSecretData {
    secret: string;
    url: string;
}
