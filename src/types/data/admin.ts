import type {
    AdminLogType,
    AdminPermissionMode,
} from '@/constants/admin';

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

export interface AdminPermissionData extends BaseMongooseModelData {
    createdByAdmin: Partial<AdminData>;
    editedByAdmin?: Partial<AdminData>;
    mode: AdminPermissionMode;
    name: string;
}
