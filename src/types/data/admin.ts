import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { AdminLogType } from '../../constants/admin';

import type { WithAdminAuditData } from './';

export interface AdminChangePasswordData {
    newPassword: string;
    oldPassword: string;
}

export interface AdminData extends BaseMongooseModelData {
    account: string;
    authenticationRevision?: number;
    email?: string;
    enabled: boolean;
    isSuperAdmin: boolean;
    password?: string;
    roles: Partial<AdminRoleData>[];
}

export interface AdminLogData extends BaseMongooseModelData<true, false> {
    admin: Partial<AdminData>;
    ip?: string;
    note?: string;
    type: AdminLogType;
}

export interface AdminLoginFormData {
    account: string;
    password: string;
}

export interface AdminRoleData extends BaseMongooseModelData, WithAdminAuditData {
    name: string;
    permissions: string[];
}
