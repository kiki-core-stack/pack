import type { ClientSession } from 'mongoose';

import type { CoreCounterType } from '../constants/core';
import { CoreCounterModel } from '../models/core/counter';

export async function getNextCoreCounterSeq(type: CoreCounterType, session: ClientSession) {
    const coreCounter = await CoreCounterModel
        .findOneAndUpdate(
            { _id: type },
            { $inc: { seq: 1 } },
            {
                returnDocument: 'after',
                session,
                upsert: true,
            },
        )
        .select(['seq'])
        .lean();

    return coreCounter.seq;
}
