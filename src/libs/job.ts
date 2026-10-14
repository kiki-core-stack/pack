import type { ClientSession } from 'mongoose';
import type { ZodSafeParseResult } from 'zod';

import { JobType } from '../constants/job';
import { JobOutboxEventModel } from '../models/job/outbox-event';
import { jobPayloadSchemas } from '../schemas/job';
import type {
    CreateJobOutboxEventInput,
    JobPayloadByType,
} from '../types/job';

import * as z from './zod';

// Constants/Variables
const createJobOutboxEventInputSchema = z.object({
    nextPublishAt: z.date().optional(),
    payload: z.unknown(),
    type: z.enum(JobType),
});

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
