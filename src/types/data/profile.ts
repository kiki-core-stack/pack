export interface ProfileSecurityChangePasswordFormData extends TwoFactorAuthenticationCodesData {
    conformPassword: string;
    newPassword: string;
    oldPassword: string;
}

export interface ProfileSecurityTotpSecretData {
    secret: string;
    url: string;
}
