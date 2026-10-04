import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import { SmsProviderCode } from '../../constants/sms';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { SmsProviderData } from '../../types/data/sms';

export type SmsProvider = SmartDataToBaseMongooseDocType<SmsProviderData>;
export type SmsProviderDocument = MongooseHydratedDocument<SmsProvider>;
type SmsProviderModel = BaseMongoosePaginateModel<SmsProvider>;

const schema = new Schema<SmsProvider, SmsProviderModel>({
    apiProxyUrl: s.string().trim.nonRequired,
    cacheKey: s.string().trim.unique.required,
    code: s.number().enum(getEnumNumberValues(SmsProviderCode)).immutable.required,
    config: s.mixed().required,
    createdByAdmin: mongooseRefSchemas.admin().required,
    editedByAdmin: mongooseRefSchemas.admin().nonRequired,
    enabled: s.boolean().default(false).required,
    name: s.string().maxlength(64).trim.unique.required,
    // @ts-expect-error Ignore this error.
    priority: s.int32().default(0).required,
});

export const SmsProviderModel = buildMongooseModel<SmsProvider, SmsProviderModel>(
    'sms.providers',
    'SmsProvider',
    schema,
);
