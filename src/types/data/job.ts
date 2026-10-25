import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { JobType } from '../../constants/job';

export interface JobOutboxEventData extends BaseMongooseModelData {
    nextPublishAt: string;
    payload: Record<string, any>;
    publishAttemptCount: number;
    publishClaimId?: string;
    publishLeaseUntil?: string;
    type: JobType;
}
