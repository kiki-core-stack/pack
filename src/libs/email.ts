import { Queue } from 'bullmq';
import type {
    DefaultJobOptions,
    QueueOptions,
} from 'bullmq';
import type { Except } from 'type-fest';

import { projectBullmqKeyPrefix } from '../constants';
import type { EmailSenderIdentityKey } from '../constants/email';
import { emailSendQueueName } from '../constants/email';
import { EmailSendRecordModel } from '../models/email/send-record';
import type { EmailSendRecordDocument } from '../models/email/send-record';
import { EmailSenderIdentityModel } from '../models/email/sender-identity';
import type { EmailSenderIdentityDocument } from '../models/email/sender-identity';
import type { EmailSendJobData } from '../types/data/email';

export type EmailSendQueue = Queue<EmailSendJobData, void, typeof emailSendQueueName>;

// Constants/Variables
const emailSendDefaultJobOptions: Readonly<DefaultJobOptions> = {
    attempts: 3,
    backoff: {
        delay: 250,
        type: 'fixed',
    },
    removeOnComplete: {
        age: 86400,
        count: 10000,
    },
    removeOnFail: {
        age: 604800,
        count: 50000,
    },
};

// Functions

/**
 * Explicit resource factory. The caller registers an error listener and closes the Queue.
 * A supplied connection adapter remains caller-owned and must be closed after its Queues.
 * Configure a bounded, fail-fast producer connection; never pass the worker's blocking connection.
 */
export function createEmailSendQueue(options: Except<QueueOptions, 'defaultJobOptions' | 'prefix'>): EmailSendQueue {
    return new Queue(
        emailSendQueueName,
        {
            ...options,
            defaultJobOptions: emailSendDefaultJobOptions,
            prefix: projectBullmqKeyPrefix,
            skipWaitingForReady: true,
        },
    );
}

/**
 * Success means records and publication intent are persisted, not that mail was sent.
 * Without a Queue the dispatcher publishes later. Immediate publication failure is returned,
 * not thrown: callers must not create replacement records after persistence succeeded.
 */
export async function enqueueEmailSendJobs(
    senderIdentity: EmailSenderIdentityDocument | EmailSenderIdentityKey,
    to: string | string[],
    subject: string,
    body: string,
    queue?: EmailSendQueue,
) {
    let from;
    if (typeof senderIdentity !== 'number') from = senderIdentity.from;
    else {
        // TODO: cache
        const emailSenderIdentity = await EmailSenderIdentityModel
            .findOne({ key: senderIdentity })
            .select([
                '-_id',
                'from',
            ])
            .lean();

        if (!emailSenderIdentity) throw new Error('Email sender identity not found');
        from = emailSenderIdentity.from;
    }

    const emailSendRecords = await EmailSendRecordModel.insertMany(
        [to].flat().map((t) => ({
            content: body,
            from,
            subject,
            to: t,
        })),
    );

    const recordIds = emailSendRecords.map((record) => record._id.toHexString());
    if (!queue || !emailSendRecords.length) {
        return {
            queuePublished: false as const,
            recordIds,
        };
    }

    try {
        await enqueueEmailSendRecordIds(emailSendRecords, queue);
        return {
            queuePublished: true as const,
            recordIds,
        };
    } catch (publicationError) {
        return {
            publicationError,
            queuePublished: false as const,
            recordIds,
        };
    }
}

/**
 * Publishes persisted record references, then marks those records as published.
 * Errors propagate to the dispatcher/caller; retry publication with the same record IDs.
 */
export async function enqueueEmailSendRecordIds(
    records: readonly Pick<EmailSendRecordDocument, '_id'>[],
    queue: EmailSendQueue,
) {
    if (!records.length) return;
    const jobs: Parameters<EmailSendQueue['addBulk']>[0] = records.map((record) => {
        const recordId = record._id.toHexString();
        return {
            data: { recordId },
            name: emailSendQueueName,
            opts: {
                ...emailSendDefaultJobOptions,
                jobId: `email-${recordId}`,
            },
        };
    });

    await queue.addBulk(jobs);
    const queuePublishedAt = new Date();
    await EmailSendRecordModel.bulkWrite(records.map((record) => ({
        updateOne: {
            filter: {
                _id: record._id,
                queuePublishedAt: { $exists: false },
            },
            update: { $set: { queuePublishedAt } },
        },
    })));
}
