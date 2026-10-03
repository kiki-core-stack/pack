import { mongooseConnections } from '@kikiutils/mongoose/constants';
import type { Arrayable } from 'type-fest';

import type { EmailSenderIdentityKey } from '../constants/email';
import { JobType } from '../constants/job';
import { EmailSendRecordModel } from '../models/email/send-record';
import { EmailSenderIdentityModel } from '../models/email/sender-identity';
import type { EmailSenderIdentityDocument } from '../models/email/sender-identity';

import { createJobOutboxEvents } from './job';

// Functions
export async function enqueueEmailSendJobs(
    senderIdentity: EmailSenderIdentityDocument | EmailSenderIdentityKey,
    to: Arrayable<string>,
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

    return await mongooseConnections.default!.transaction(async (session) => {
        const emailSendRecords = await EmailSendRecordModel.insertMany(
            [to].flat().map((t) => ({
                content: body,
                from,
                subject,
                to: t,
            })),
            { session },
        );

        await createJobOutboxEvents(
            emailSendRecords.map((emailSendRecord) => ({
                payload: { recordId: emailSendRecord._id.toHexString() },
                type: JobType.SendEmail,
            })),
            session,
        );

        return emailSendRecords;
    });
}
