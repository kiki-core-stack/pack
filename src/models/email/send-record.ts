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

export type EmailSendRecord = SmartDataToBaseMongooseDocType<
    EmailSendRecordData,
    'provider',
    'nextPublishAt' | 'queuePublishedAt'
>;

export type EmailSendRecordDocument = MongooseHydratedDocument<EmailSendRecord>;
type EmailSendRecordModel = BaseMongoosePaginateModel<EmailSendRecord>;

const schema = new Schema<EmailSendRecord, EmailSendRecordModel>({
    attemptId: s.string().trim.nonRequired,
    content: s.string().trim.required,
    failureReason: s.string().trim.nonRequired,
    from: s.string().trim.required,
    nextPublishAt: s.date().default(() => new Date()).required,
    provider: mongooseRefSchemas.emailProvider().nonRequired,
    providerTransactionId: s.string().trim.nonRequired,
    queuePublishedAt: s.date().nonRequired,
    status: s.number().default(EmailSendRecordStatus.Pending).enum(getEnumNumberValues(EmailSendRecordStatus)).required,
    subject: s.string().trim.required,
    to: s.string().trim.required,
});

// Compound index key order is part of the dispatcher query contract.

schema.index({
    /* eslint-disable perfectionist/sort-objects */
    status: 1,
    queuePublishedAt: 1,
    nextPublishAt: 1,
    _id: 1,
    /* eslint-enable perfectionist/sort-objects */
});

// Published, unresolved records are reconciled in queuePublishedAt / _id order per status.
schema.index({
    /* eslint-disable perfectionist/sort-objects */
    status: 1,
    queuePublishedAt: 1,
    _id: 1,
    /* eslint-enable perfectionist/sort-objects */
});

export const EmailSendRecordModel = buildMongooseModel<EmailSendRecord, EmailSendRecordModel>(
    'email.send_records',
    'EmailSendRecord',
    schema,
);
