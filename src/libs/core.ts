import type { ClientSession } from 'mongoose';

import type { CoreCounterType } from '../constants/core';
import { CoreCounterModel } from '../models/core/counter';

export async function getNextCoreCounterSeq(type: CoreCounterType, session: ClientSession) {
    const coreCounter = await CoreCounterModel
        .findOneAndUpdate(
            { _id: type },
            { $inc: { seq: 1 } },
            {
                new: true,
                projection: { seq: true },
                session,
                upsert: true,
            },
        )
        .lean();

    return coreCounter.seq;
}
