import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { JobType } from '../constants/job';
import * as z from '../libs/zod';

/**
 * Job outbox event payloads by `type`; validate with `jobOutboxEventPayloadVariants.parse(type, payload)` (or
 * `safeParse`).
 */
export const jobOutboxEventPayloadVariants = z.discriminatedMap(
    'type',
    'payload',
    {
        [JobType.SendEmail]: z.object({ recordId: z.objectIdString() }),
        [JobType.SendSms]: z.object({ recordId: z.objectIdString() }),
    } satisfies ReadonlyRecord<JobType, z.ZodType>,
);
