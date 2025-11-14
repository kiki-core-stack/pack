import type { EmailSenderIdentityKey } from '../constants/email';
import { redisClient } from '../constants/redis';
import { EmailSendRecordModel } from '../models/email/send-record';
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

    await Promise.all(
        emailSendRecords.map((emailSendRecord) => {
            return redisClient.send('XADD', [
                'email.send.jobs',
                'MAXLEN',
                '~',
                '100000',
                '*',
                'id',
                emailSendRecord._id.toHexString(),
            ]);
        }),
    );
}
