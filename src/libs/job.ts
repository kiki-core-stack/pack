import type { ClientSession } from 'mongoose';

import { JobOutboxEventModel } from '../models/job/outbox-event';
import type { CreateJobOutboxEventInput } from '../types/job';

// Pass the business transaction's session to persist its changes and events atomically.
// These helpers do not start or commit a transaction themselves.
export function createJobOutboxEvents(events: CreateJobOutboxEventInput[], session?: ClientSession) {
    return JobOutboxEventModel.insertMany(events, { session });
}
