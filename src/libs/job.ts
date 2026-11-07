import type { ClientSession } from 'mongoose';

import { JobType } from '../constants/job';
import { JobOutboxEventModel } from '../models/job/outbox-event';
import { parseJobOutboxEventPayload } from '../schemas/job';
import type { CreateJobOutboxEventInput } from '../types/job';

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
        await Promise.all(events.map(async (event) => {
            const input = await createJobOutboxEventInputSchema.parseAsync(event);
            return {
                ...input,
                payload: await parseJobOutboxEventPayload(input.type, input.payload),
            };
        })),
        { session },
    );
}
