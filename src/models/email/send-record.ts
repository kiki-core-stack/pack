import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { EmailSendRecordStatus } from '../../constants/email';
import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { EmailSendRecordData } from '../../types/data/email';

export type EmailSendRecord = SmartDataToBaseMongooseDocType<EmailSendRecordData, 'platform', 'sentAt'>;
export type EmailSendRecordDocument = MongooseHydratedDocument<EmailSendRecord>;
type EmailSendRecordModel = BaseMongoosePaginateModel<EmailSendRecord>;

const schema = new Schema<EmailSendRecord, EmailSendRecordModel>({
    content: s.string().trim.required,
    failureReason: s.string().trim.nonRequired,
    from: s.string().trim.required,
    platform: mongooseRefSchemas.emailPlatform().nonRequired,
    sentAt: s.date().nonRequired,
    serviceProviderTransactionId: s.string().trim.nonRequired,
    status: s.number().default(EmailSendRecordStatus.Pending).enum(getEnumNumberValues(EmailSendRecordStatus)).required,
    subject: s.string().trim.required,
    to: s.string().trim.required,
});

schema.index({
    status: 1,
    updatedAt: 1,
});

export const EmailSendRecordModel = buildMongooseModel<EmailSendRecord, EmailSendRecordModel>(
    'email.send_records',
    'EmailSendRecord',
    schema,
);
