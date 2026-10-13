import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { PlatformConfigScope } from '../../constants/platform';
import * as mongooseRefSchemas from '../../schemas/mongoose/refs';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { PlatformConfigData } from '../../types/data/platform';

export type PlatformConfig = SmartDataToBaseMongooseDocType<PlatformConfigData>;
export type PlatformConfigDocument = MongooseHydratedDocument<PlatformConfig>;
type PlatformConfigModel = BaseMongoosePaginateModel<PlatformConfig>;

const schema = new Schema<PlatformConfig, PlatformConfigModel>({
    config: s.mixed().required,
    createdByAdmin: mongooseRefSchemas.admin().required,
    editedByAdmin: mongooseRefSchemas.admin().nonRequired,
    scope: s.number().enum(getEnumNumberValues(PlatformConfigScope)).immutable.unique.required,
});

export const PlatformConfigModel = buildMongooseModel<PlatformConfig, PlatformConfigModel>(
    'platform.configs',
    'PlatformConfig',
    schema,
);
