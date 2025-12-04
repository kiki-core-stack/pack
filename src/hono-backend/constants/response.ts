import type { PartialRecord } from '@kikiutils/shared/types';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { CommonApiResponseErrorCode } from '../types/api';

export const statusCodeToApiResponseErrorCodeMap: Readonly<
    PartialRecord<ContentfulStatusCode, CommonApiResponseErrorCode>
> = {
    400: 'badRequest',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'notFound',
    409: 'conflict',
    410: 'gone',
    413: 'payloadTooLarge',
    422: 'validationFailed',
    429: 'tooManyRequests',
    500: 'internalServerError',
    503: 'serviceUnavailable',
    504: 'gatewayTimeout',
};
