import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { PlatformIpAccessPolicyMode } from '../../constants/platform';
import type {
    PlatformConfigVariant,
    PlatformIpAccessPolicyTarget,
} from '../platform';

import type { WithAdminAuditData } from './';

export type PlatformConfigData = PlatformConfigBaseData & PlatformConfigVariant;

export interface PlatformConfigBaseData extends BaseMongooseModelData, WithAdminAuditData {}

export interface PlatformIpAccessPolicyData extends BaseMongooseModelData, WithAdminAuditData {
    enabled: boolean;
    ipEntries: string[];
    mode: PlatformIpAccessPolicyMode;
    name: string;
    note?: string;
    targets: PlatformIpAccessPolicyTarget[];
}
