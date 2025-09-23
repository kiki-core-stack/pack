import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { CoreCounterType } from '../../constants/core';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { CoreCounterData } from '../../types/data/core';

export type CoreCounter = SmartDataToBaseMongooseDocType<CoreCounterData>;
export type CoreCounterDocument = MongooseHydratedDocument<CoreCounter>;
type CoreCounterModel = BaseMongoosePaginateModel<CoreCounter>;

const schema = new Schema<CoreCounter, CoreCounterModel>({
    _id: s.number().enum(getEnumNumberValues(CoreCounterType)).required,
    seq: s.number().default(0).required,
});

export const CoreCounterModel = buildMongooseModel<CoreCounter, CoreCounterModel>(
    'core.counters',
    'CoreCounter',
    schema,
);
