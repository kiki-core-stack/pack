import { consola as logger } from 'consola';

import type { EmailSenderIdentityKey } from '../../constants/email';
import { EmailSendRecordModel } from '../../models/email/send-record';
import { EmailSenderIdentityModel } from '../../models/email/sender-identity';
import type { EmailSenderIdentityDocument } from '../../models/email/sender-identity';

import { enqueueEmailSendRecordIds } from './queue';

// Functions
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
            .findOne({
                enabled: true,
                key: senderIdentity,
            })
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

    if (!emailSendRecords.length) return [];
    const recordIds = emailSendRecords.map((record) => record._id.toHexString());
    await enqueueEmailSendRecordIds(emailSendRecords).catch((error) => logger.error(error));
    return recordIds;
}
