import { Queue } from 'bullmq';
import type { DefaultJobOptions } from 'bullmq';

import { projectBullmqKeyPrefix } from '..';
import type { EmailSendJobData } from '../../types/data/email';
import { bullMqRedisConnection } from '../bullmq';

import { emailSendQueueName } from './';

const emailSendQueueDefaultJobOptions: Readonly<DefaultJobOptions> = {
    attempts: 3,
    backoff: {
        delay: 250,
        type: 'fixed',
    },
    removeOnComplete: {
        age: 7 * 24 * 60 * 60,
        count: 100000,
    },
    removeOnFail: {
        age: 7 * 24 * 60 * 60,
        count: 50000,
    },
};

export const emailSendQueue = new Queue<EmailSendJobData, void, typeof emailSendQueueName>(
    emailSendQueueName,
    {
        connection: bullMqRedisConnection,
        defaultJobOptions: emailSendQueueDefaultJobOptions,
        prefix: projectBullmqKeyPrefix,
        skipWaitingForReady: true,
    },
);
