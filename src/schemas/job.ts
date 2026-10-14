import type { ReadonlyRecord } from '@kikiutils/shared/types';
import type { ZodType } from 'zod';

import { JobType } from '../constants/job';
import * as z from '../libs/zod';

export const jobPayloadSchemas = {
    [JobType.SendEmail]: z.object({ recordId: z.objectIdString() }),
    [JobType.SendSms]: z.object({ recordId: z.objectIdString() }),
} satisfies ReadonlyRecord<JobType, ZodType>;
