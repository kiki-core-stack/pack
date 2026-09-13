import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import * as mongooseRefSchemas from '../../constants/mongoose/ref-schemas';
import { SmsSendRecordStatus } from '../../constants/sms';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { SmsSendRecordData } from '../../types/data/sms';

export type SmsSendRecord = SmartDataToBaseMongooseDocType<SmsSendRecordData, 'provider'>;
export type SmsSendRecordDocument = MongooseHydratedDocument<SmsSendRecord>;
type SmsSendRecordModel = BaseMongoosePaginateModel<SmsSendRecord>;

const schema = new Schema<SmsSendRecord, SmsSendRecordModel>({
    attemptId: s.string().trim.nonRequired,
    content: s.string().trim.required,
    failureReason: s.string().trim.nonRequired,
    provider: mongooseRefSchemas.smsProvider().nonRequired,
    providerTransactionId: s.string().trim.nonRequired,
    sender: s.string().trim.nonRequired,
    status: s.number().default(SmsSendRecordStatus.Pending).enum(getEnumNumberValues(SmsSendRecordStatus)).required,
    to: s.string().trim.required,
});

schema.index({
    /* eslint-disable perfectionist/sort-objects */
    status: 1,
    updatedAt: 1,
    _id: 1,
    /* eslint-enable perfectionist/sort-objects */
});

export const SmsSendRecordModel = buildMongooseModel<SmsSendRecord, SmsSendRecordModel>(
    'sms.send_records',
    'SmsSendRecord',
    schema,
);
