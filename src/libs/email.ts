import { debounce } from 'es-toolkit';

import { redisClient } from '../constants/redis';
import { EmailSendRecordModel } from '../models/email/send-record';

const notifyEmailSendWorkerJobUpdate = debounce(() => redisClient.publish('jobs.email.send.updated', ''), 5000);

export async function createAndDispatchEmailSendJob(
    to: string | string[],
    subject: string,
    body: string,
    from?: string,
) {
    await EmailSendRecordModel.insertMany(
        [to].flat().map((t) => ({
            content: body,
            from,
            subject,
            to: t,
        })),
    );

    notifyEmailSendWorkerJobUpdate();
}
