import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { JobOutboxEventPayloadVariant } from '../job';

export type JobOutboxEventData = JobOutboxEventBaseData & JobOutboxEventPayloadVariant;

export interface JobOutboxEventBaseData extends BaseMongooseModelData {
    nextPublishAt: string;
    publishAttemptCount: number;
    publishClaimId?: string;
    publishLeaseUntil?: string;
}
