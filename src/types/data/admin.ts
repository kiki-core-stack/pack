import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { AdminLogType } from '../../constants/admin';

import type { WithAdminAuditData } from './';

export interface AdminChangePasswordData {
    newPassword: string;
    oldPassword: string;
}

export interface AdminData extends BaseMongooseModelData {
    account: string;
    email?: string;
    enabled: boolean;
    isSuperAdmin: boolean;
    password?: string;
    roles: Partial<AdminRoleData>[];
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

export interface AdminQrCodeLoginData {
    adminId?: string;
    ip: string;
    status: 'approved' | 'pending';
    userAgent?: string;
}

export interface AdminRoleData extends BaseMongooseModelData, WithAdminAuditData {
    name: string;
    permissions: string[];
}

export interface AdminSessionData {
    adminId: string;
    id: string;
    isCurrent?: boolean;
    lastActiveAt: string;
    lastActiveIp: string;
    loggedAt: string;
    loginIp: string;
    userAgent?: string;
}
