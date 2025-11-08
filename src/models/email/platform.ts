import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { EmailServiceProvider } from '../../constants/email';
import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { EmailPlatformData } from '../../types/data/email';

export type EmailPlatform = SmartDataToBaseMongooseDocType<EmailPlatformData>;
export type EmailPlatformDocument = MongooseHydratedDocument<EmailPlatform>;
type EmailPlatformModel = BaseMongoosePaginateModel<EmailPlatform>;

const schema = new Schema<EmailPlatform, EmailPlatformModel>({
    config: {
        required: true,
        type: Object,
    },
    configMd5: s.string().trim.required,
    createdByAdmin: mongooseRefSchemas.admin().required,
    editedByAdmin: mongooseRefSchemas.admin().nonRequired,
    enabled: s.boolean().default(false).required,
    name: s.string().maxlength(32).trim.unique.required,
    priority: s.number().default(0).required,
    serviceProvider: s.number().enum(getEnumNumberValues(EmailServiceProvider)).immutable.required,
});

export const EmailPlatformModel = buildMongooseModel<EmailPlatform, EmailPlatformModel>(
    'email.platforms',
    'EmailPlatform',
    schema,
);
