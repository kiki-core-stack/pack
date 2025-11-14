import { redisClient } from '../constants/redis';
import { EmailSendRecordModel } from '../models/email/send-record';

export async function enqueueEmailSendJobs(
    to: string | string[],
    subject: string,
    body: string,
    from?: string,
) {
    const emailSendRecords = await EmailSendRecordModel.insertMany(
        [to].flat().map((t) => ({
            content: body,
            from,
            subject,
            to: t,
        })),
    );

    await Promise.all(
        emailSendRecords.map(
            (emailSendRecord) => redisClient.rpush('email.send.queue', emailSendRecord._id.toHexString()),
        ),
    );
}
