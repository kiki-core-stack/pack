import type { JobType } from '../constants/job';

// A discriminated union keeps each job type paired with its own payload.
export type CreateJobOutboxEventInput = {
    [T in keyof JobPayloadByType]: {
        nextPublishAt?: Date;
        payload: JobPayloadByType[T];
        type: T;
    };
}[keyof JobPayloadByType];

// Add a matching payload entry here when introducing a new job type.
export interface JobPayloadByType {
    [JobType.SendEmail]: { recordId: string };
    [JobType.SendSms]: { recordId: string };
}
