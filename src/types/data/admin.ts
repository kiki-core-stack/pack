import type {
    AdminLogType,
    AdminPermissionMode,
} from '../../constants/admin';

export interface AdminChangePasswordData {
    newPassword: string;
    oldPassword: string;
}

export interface AdminData extends BaseMongooseModelData {
    account: string;
    email?: string;
    enabled: boolean;
    name: string;
    password?: string;
}

export interface AdminGroupData extends BaseMongooseModelData {
    adminCount?: number;
    createdByAdmin: Partial<AdminData>;
    editedByAdmin?: Partial<AdminData>;
    name: string;
    permissions: Partial<AdminPermissionData>[];
}

export interface AdminLogData extends BaseMongooseModelData<true, false> {
    a: Partial<AdminData>;
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

export interface AdminPermissionData extends BaseMongooseModelData {
    createdByAdmin: Partial<AdminData>;
    editedByAdmin?: Partial<AdminData>;
    mode: AdminPermissionMode;
    name: string;
}

export interface AdminSessionData extends BaseMongooseModelData {
    a: Partial<AdminData>;
    isCurrent?: boolean;
    lastActiveAt: string;
    lastActiveIp: string;
    loginIp: string;
    token?: string;
    userAgent?: string;
}
