import type { AdminLogType } from '../../constants/admin';

export interface AdminChangePasswordData {
    newPassword: string;
    oldPassword: string;
}

export interface AdminData extends BaseMongooseModelData {
    account: string;
    email?: string;
    enabled: boolean;
    password?: string;
}

export interface AdminLogData extends BaseMongooseModelData<true, false> {
    admin: Partial<AdminData>;
    fingerprint?: string;
    ip?: string;
    note?: string;
    type: AdminLogType;
}

export interface AdminLoginFormData {
    account: string;
    password: string;
    verCode: string;
}

export interface AdminRoleData extends BaseMongooseModelData, WithAdminAuditData {
    name: string;
    permissions: string[];
}

export interface AdminSessionData extends BaseMongooseModelData {
    admin: Partial<AdminData>;
    isCurrent?: boolean;
    lastActiveAt: string;
    lastActiveIp: string;
    loginIp: string;
    token?: string;
    userAgent?: string;
}
