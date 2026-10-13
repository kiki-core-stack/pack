import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { PlatformConfigScope } from '../../constants/platform';
import type { PlatformConfigValues } from '../platform';

import type { WithAdminAuditData } from './';

export interface PlatformConfigData extends BaseMongooseModelData, WithAdminAuditData {
    config: PlatformConfigValues;
    scope: PlatformConfigScope;
}
