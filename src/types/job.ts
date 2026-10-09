import type { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import type * as z from 'zod';

import type { JobType } from '../constants/job';
import type { jobPayloadSchemas } from '../libs/job';

export type CreateJobOutboxEventInput<T extends JobType = JobType> = {
    [K in T]: {
        nextPublishAt?: EnhancedDate;
        payload: JobPayloadByType[K];
        type: K;
    };
}[T];

export type JobPayloadByType = { [T in keyof typeof jobPayloadSchemas]: z.infer<(typeof jobPayloadSchemas)[T]>; };
