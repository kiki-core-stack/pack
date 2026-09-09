import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';
import type { AnyRecord } from '@kikiutils/shared/types';

import type { JobType } from '../../constants/job';

export interface JobOutboxEventData extends BaseMongooseModelData {
    nextPublishAt: string;
    payload: AnyRecord;
    publishAttempts: number;
    publishClaimId?: string;
    publishLeaseUntil?: string;
    type: JobType;
}
