import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { AdminLogMetadataVariant } from '../admin';

import type { WithAdminAuditData } from './';

export type AdminLogData = AdminLogBaseData & AdminLogMetadataVariant;

export interface AdminData extends BaseMongooseModelData {
    account: string;
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

export interface AdminRoleData extends BaseMongooseModelData, WithAdminAuditData {
    name: string;
    permissions: string[];
}
