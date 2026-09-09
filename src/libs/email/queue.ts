import { Types } from 'mongoose';

import { emailSendQueueName } from '../../constants/email';
import { emailSendQueue } from '../../constants/email/queue';
import { EmailSendRecordModel } from '../../models/email/send-record';

// Functions
export async function enqueueEmailSendRecordIds(emailSendRecordOrIds: (Types.ObjectId | { _id: Types.ObjectId })[]) {
    if (!emailSendRecordOrIds.length) return;
    const emailSendRecordIds = emailSendRecordOrIds.map((emailSendRecordId) => {
        return emailSendRecordId instanceof Types.ObjectId ? emailSendRecordId : emailSendRecordId._id;
    });

    const sendJobs: Parameters<typeof emailSendQueue['addBulk']>[0] = emailSendRecordIds.map((emailSendRecordId) => {
        const recordId = emailSendRecordId.toString();
        return {
            data: { recordId },
            name: emailSendQueueName,
            opts: { jobId: `email-${recordId}` },
        };
    });

    await emailSendQueue.addBulk(sendJobs);
    const queuePublishedAt = new Date();
    await EmailSendRecordModel.bulkWrite(emailSendRecordIds.map((emailSendRecordId) => ({
        updateOne: {
            filter: {
                _id: emailSendRecordId,
                queuePublishedAt: { $exists: false },
            },
            update: { $set: { queuePublishedAt } },
        },
    })));
}
