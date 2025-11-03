import type { PartialRecord } from '@kikiutils/shared/types';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const statusCodeToApiResponseErrorCodeMap: Readonly<PartialRecord<ContentfulStatusCode, string>> = {
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
