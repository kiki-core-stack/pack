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
    cacheKey: s.string().trim.required,
    code: s.number().enum(getEnumNumberValues(SmsProviderCode)).immutable.required,
    config: {
        required: true,
        type: Object,
    },
    createdByAdmin: mongooseRefSchemas.admin().required,
    editedByAdmin: mongooseRefSchemas.admin().nonRequired,
    enabled: s.boolean().default(false).required,
    name: s.string().maxlength(64).trim.unique.required,
    priority: s.number().default(0).required,
});

schema.index(
    {
        cacheKey: 1,
        code: 1,
    },
    { unique: true },
);

export const SmsProviderModel = buildMongooseModel<SmsProvider, SmsProviderModel>(
    'sms.providers',
    'SmsProvider',
    schema,
);
