import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { EmailSenderIdentityKey } from '../../constants/email';
import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { EmailSenderIdentityData } from '../../types/data/email';

export type EmailSenderIdentity = SmartDataToBaseMongooseDocType<EmailSenderIdentityData>;
export type EmailSenderIdentityDocument = MongooseHydratedDocument<EmailSenderIdentity>;
type EmailSenderIdentityModel = BaseMongoosePaginateModel<EmailSenderIdentity>;

const schema = new Schema<EmailSenderIdentity, EmailSenderIdentityModel>({
    createdByAdmin: mongooseRefSchemas.admin().required,
    editedByAdmin: mongooseRefSchemas.admin().nonRequired,
    enabled: s.boolean().default(false).required,
    from: s.string().trim.required,
    key: s.number().enum(getEnumNumberValues(EmailSenderIdentityKey)).unique.required,
});

export const EmailSenderIdentityModel = buildMongooseModel<EmailSenderIdentity, EmailSenderIdentityModel>(
    'email.sender_identities',
    'EmailSenderIdentity',
    schema,
);
