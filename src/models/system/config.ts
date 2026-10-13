import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import { SystemConfigScope } from '../../constants/system';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { SystemConfigData } from '../../types/data/system';

export type SystemConfig = SmartDataToBaseMongooseDocType<SystemConfigData>;
export type SystemConfigDocument = MongooseHydratedDocument<SystemConfig>;
type SystemConfigModel = BaseMongoosePaginateModel<SystemConfig>;

const schema = new Schema<SystemConfig, SystemConfigModel>({
    config: s.mixed().required,
    createdByAdmin: mongooseRefSchemas.admin().required,
    editedByAdmin: mongooseRefSchemas.admin().nonRequired,
    scope: s.number().enum(getEnumNumberValues(SystemConfigScope)).immutable.unique.required,
});

export const SystemConfigModel = buildMongooseModel<SystemConfig, SystemConfigModel>(
    'system.configs',
    'SystemConfig',
    schema,
);
