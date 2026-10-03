import { mongooseConnections } from '@kikiutils/mongoose/constants';
import type { Arrayable } from 'type-fest';

import { JobType } from '../constants/job';
import { SmsSendRecordModel } from '../models/sms/send-record';

import { createJobOutboxEvents } from './job';

// Functions
export function enqueueSmsSendJobs(to: Arrayable<string>, content: string) {
    return mongooseConnections.default!.transaction(async (session) => {
        const smsSendRecords = await SmsSendRecordModel.insertMany(
            [to].flat().map((t) => ({
                content,
                to: t,
            })),
            { session },
        );

        await createJobOutboxEvents(
            smsSendRecords.map((smsSendRecord) => ({
                payload: { recordId: smsSendRecord._id.toHexString() },
                type: JobType.SendSms,
            })),
            session,
        );

        return smsSendRecords;
    });
}
