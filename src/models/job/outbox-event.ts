import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { JobType } from '../../constants/job';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { JobOutboxEventBaseData } from '../../types/data/job';
import type { JobOutboxEventPayloadVariant } from '../../types/job';

export type JobOutboxEvent =
  & JobOutboxEventPayloadVariant
  & SmartDataToBaseMongooseDocType<JobOutboxEventBaseData, never, 'nextPublishAt' | 'publishLeaseUntil'>;

export type JobOutboxEventDocument = MongooseHydratedDocument<JobOutboxEvent>;
type JobOutboxEventModel = BaseMongoosePaginateModel<JobOutboxEvent>;

const schema = new Schema<JobOutboxEvent, JobOutboxEventModel>({
    nextPublishAt: s.date().default(() => new EnhancedDate()).required,
    payload: s.mixed().required,
    publishAttemptCount: s.int32().default(0).min(0).required,
    publishClaimId: s.string().trim.nonRequired,
    publishLeaseUntil: s.date().nonRequired,
    type: s.number().enum(getEnumNumberValues(JobType)).required,
});

schema.index({
    /* eslint-disable perfectionist/sort-objects */
    nextPublishAt: 1,
    publishLeaseUntil: 1,
    _id: 1,
    /* eslint-enable perfectionist/sort-objects */
});

export const JobOutboxEventModel = buildMongooseModel<JobOutboxEvent, JobOutboxEventModel>(
    'job.outbox_events',
    'JobOutboxEvent',
    schema,
);
