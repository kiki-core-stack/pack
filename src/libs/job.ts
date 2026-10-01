import type { ReadonlyRecord } from '@kikiutils/shared/types';
import type { ClientSession } from 'mongoose';
import type {
    ZodSafeParseResult,
    ZodType,
} from 'zod';

import { JobType } from '../constants/job';
import { JobOutboxEventModel } from '../models/job/outbox-event';
import type {
    CreateJobOutboxEventInput,
    JobPayloadByType,
} from '../types/job';

import * as z from './zod';

// Constants/Variables
// TODO: 移動到constants/job/ 看要怎樣拆分
const createJobOutboxEventInputSchema = z.object({
    nextPublishAt: z.date().optional(),
    payload: z.unknown(),
    type: z.enum(JobType),
});

export const jobPayloadSchemas = {
    [JobType.SendEmail]: z.object({ recordId: z.objectIdString() }),
    [JobType.SendSms]: z.object({ recordId: z.objectIdString() }),
} satisfies ReadonlyRecord<JobType, ZodType>;

// Functions

// Pass the business transaction's session to persist its changes and events atomically.
// These helpers do not start or commit a transaction themselves.
export async function createJobOutboxEvents(events: CreateJobOutboxEventInput[], session?: ClientSession) {
    return await JobOutboxEventModel.insertMany(
        events.map((event) => {
            const input = createJobOutboxEventInputSchema.parse(event);
            return {
                ...input,
                payload: jobPayloadSchemas[input.type].parse(input.payload),
            };
        }),
        { session },
    );
}

export function safeParseJobPayload<T extends JobType>(type: T, input: unknown) {
    return jobPayloadSchemas[type].safeParse(input) as ZodSafeParseResult<JobPayloadByType[T]>;
}
