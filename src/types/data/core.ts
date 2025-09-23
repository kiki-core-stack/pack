import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';
import type { Except } from 'type-fest';

import type { CoreCounterType } from '../../constants/core';

export interface CoreCounterData extends Except<BaseMongooseModelData, 'id'> {
    _id: CoreCounterType;
    seq: number;
}
