import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { JobType } from '../../constants/job';
import type { SmartDataToBaseMongooseDocType } from '../../types/data';
import type { JobOutboxEventData } from '../../types/data/job';

export type JobOutboxEvent = SmartDataToBaseMongooseDocType<
    JobOutboxEventData,
    never,
    'nextPublishAt' | 'publishLeaseUntil'
>;

export type JobOutboxEventDocument = MongooseHydratedDocument<JobOutboxEvent>;
type JobOutboxEventModel = BaseMongoosePaginateModel<JobOutboxEvent>;

const schema = new Schema<JobOutboxEvent, JobOutboxEventModel>({
    nextPublishAt: s.date().default(() => new Date()).required,
    payload: {
        required: true,
        type: Schema.Types.Mixed,
    },
    publishAttempts: s.number().default(0).min(0).required,
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
