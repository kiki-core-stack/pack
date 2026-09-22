import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { EmailProviderCode } from '../../constants/email';
import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { EmailProviderData } from '../../types/data/email';

export type EmailProvider = SmartDataToBaseMongooseDocType<EmailProviderData>;
export type EmailProviderDocument = MongooseHydratedDocument<EmailProvider>;
type EmailProviderModel = BaseMongoosePaginateModel<EmailProvider>;

const schema = new Schema<EmailProvider, EmailProviderModel>({
    apiProxyUrl: s.string().trim.nonRequired,
    cacheKey: s.string().trim.required,
    code: s.number().enum(getEnumNumberValues(EmailProviderCode)).immutable.required,
    config: {
        required: true,
        type: Schema.Types.Mixed,
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

export const EmailProviderModel = buildMongooseModel<EmailProvider, EmailProviderModel>(
    'email.providers',
    'EmailProvider',
    schema,
);
