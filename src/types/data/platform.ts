import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type {
    PlatformConfigScope,
    PlatformIpAccessPolicyMode,
} from '../../constants/platform';
import type {
    PlatformConfigValues,
    PlatformIpAccessPolicyTarget,
} from '../platform';

import type { WithAdminAuditData } from './';

export interface PlatformConfigData extends BaseMongooseModelData, WithAdminAuditData {
    config: PlatformConfigValues;
    scope: PlatformConfigScope;
}

export interface PlatformIpAccessPolicyData extends BaseMongooseModelData, WithAdminAuditData {
    enabled: boolean;
    ipEntries: string[];
    mode: PlatformIpAccessPolicyMode;
    name: string;
    note?: string;
    targets: PlatformIpAccessPolicyTarget[];
}
