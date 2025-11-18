import type { RedisClient } from 'bun';
import { Types } from 'mongoose';

import type { EmailSenderIdentityKey } from '../constants/email';
import { redisClient as globalRedisClient } from '../constants/redis';
import { EmailSendRecordModel } from '../models/email/send-record';
import type { EmailSendRecordDocument } from '../models/email/send-record';
import { EmailSenderIdentityModel } from '../models/email/sender-identity';
import type { EmailSenderIdentityDocument } from '../models/email/sender-identity';

export async function enqueueEmailSendJobs(
    senderIdentity: EmailSenderIdentityDocument | EmailSenderIdentityKey,
    to: string | string[],
    subject: string,
    body: string,
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

    await enqueueEmailSendRecordIds(emailSendRecords);
}

export function enqueueEmailSendRecordIds(
    emailSendRecordOrIds: (EmailSendRecordDocument | Types.ObjectId)[],
    redisClient: RedisClient = globalRedisClient,
) {
    return Promise.all(
        emailSendRecordOrIds.map((emailSendRecordOrId) => {
            const emailSendRecordId = emailSendRecordOrId instanceof Types.ObjectId
                ? emailSendRecordOrId
                : emailSendRecordOrId._id;

            return redisClient.lpush('email:send:queue', emailSendRecordId.toHexString());
        }),
    );
}
