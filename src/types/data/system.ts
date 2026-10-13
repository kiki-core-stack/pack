import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { SystemConfigScope } from '../../constants/system';
import type { SystemConfigValues } from '../system';

import type { WithAdminAuditData } from './';

export interface SystemConfigData extends BaseMongooseModelData, WithAdminAuditData {
    config: SystemConfigValues;
    scope: SystemConfigScope;
}
