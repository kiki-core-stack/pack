import type { ArrayValues } from 'type-fest';

import type {
    authFactors,
    authSecondFactors,
} from '../constants/auth';

export type AuthFactor = ArrayValues<typeof authFactors>;
export type AuthSecondFactor = ArrayValues<typeof authSecondFactors>;
