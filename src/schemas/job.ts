import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { JobType } from '../constants/job';
import * as z from '../libs/zod';
import type { JobOutboxEventPayloadByType } from '../types/job';

export const jobOutboxEventPayloadSchemas = {
    [JobType.SendEmail]: z.object({ recordId: z.objectIdString() }),
    [JobType.SendSms]: z.object({ recordId: z.objectIdString() }),
} satisfies ReadonlyRecord<JobType, z.ZodType>;

// Functions
export async function parseJobOutboxEventPayload<T extends JobType>(type: T, input: unknown) {
    return await jobOutboxEventPayloadSchemas[type].parseAsync(input) as JobOutboxEventPayloadByType[T];
}

export async function safeParseJobOutboxEventPayload<T extends JobType>(type: T, input: unknown) {
    return await jobOutboxEventPayloadSchemas[type].safeParseAsync(input) as z.ZodSafeParseResult<
        JobOutboxEventPayloadByType[T]
    >;
}
