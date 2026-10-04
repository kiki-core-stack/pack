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
    cacheKey: s.string().trim.unique.required,
    code: s.number().enum(getEnumNumberValues(EmailProviderCode)).immutable.required,
    config: s.mixed().required,
    createdByAdmin: mongooseRefSchemas.admin().required,
    editedByAdmin: mongooseRefSchemas.admin().nonRequired,
    enabled: s.boolean().default(false).required,
    name: s.string().maxlength(64).trim.unique.required,
    // @ts-expect-error Ignore this error.
    priority: s.int32().default(0).required,
});

export const EmailProviderModel = buildMongooseModel<EmailProvider, EmailProviderModel>(
    'email.providers',
    'EmailProvider',
    schema,
);
