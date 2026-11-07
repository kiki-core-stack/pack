import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { AdminLogMetadataVariant } from '../admin';

import type { WithAdminAuditData } from './';

export type AdminLogData = AdminLogBaseData & AdminLogMetadataVariant;

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
    roles: Array<Partial<AdminRoleData>>;
}

export interface AdminLogBaseData extends BaseMongooseModelData<true, false> {
    admin: Partial<AdminData>;
    ip?: string;
    note?: string;
}

export interface AdminLoginFormData {
    account: string;
    password: string;
}

export interface AdminRoleData extends BaseMongooseModelData, WithAdminAuditData {
    name: string;
    permissions: string[];
}
