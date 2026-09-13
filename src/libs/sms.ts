import { mongooseConnections } from '@kikiutils/mongoose/constants';

import { JobType } from '../constants/job';
import { JobOutboxEventModel } from '../models/job/outbox-event';
import { SmsSendRecordModel } from '../models/sms/send-record';

// Functions
export function enqueueSmsSendJobs(to: string | string[], content: string) {
    return mongooseConnections.default!.transaction(async (session) => {
        const smsSendRecords = await SmsSendRecordModel.insertMany(
            [to].flat().map((t) => ({
                content,
                to: t,
            })),
            { session },
        );

        await JobOutboxEventModel.insertMany(
            smsSendRecords.map((smsSendRecord) => ({
                payload: { recordId: smsSendRecord._id.toHexString() },
                type: JobType.SendSms,
            })),
            { session },
        );

        return smsSendRecords;
    });
}
