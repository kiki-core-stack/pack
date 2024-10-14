import { mapValues } from 'lodash-es';

import { statusCodeToMessageMap } from './';

export const statusCodeToResponseTextMap = Object.freeze<Record<number, string>>(mapValues(statusCodeToMessageMap, (_, code) => new ApiError(+code).message));
