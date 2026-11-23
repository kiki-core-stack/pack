import { packLocaleCatalogs } from '../../i18n/catalogs';
import {
    duplicateKeyErrorDataSchema,
    validationFailedErrorDataSchema,
} from '../../schemas/api';
import { defineApiErrors } from '../libs/api/error';

export const {
    badRequest,
    conflict,
    duplicateKey,
    forbidden,
    gatewayTimeout,
    gone,
    internalServerError,
    notFound,
    payloadTooLarge,
    serviceUnavailable,
    tooManyRequests,
    unauthorized,
    validationFailed,
} = defineApiErrors(
    {
        badRequest: { status: 400 },
        conflict: { status: 409 },
        duplicateKey: {
            errorData: duplicateKeyErrorDataSchema,
            status: 409,
        },
        forbidden: { status: 403 },
        gatewayTimeout: { status: 504 },
        gone: { status: 410 },
        internalServerError: { status: 500 },
        notFound: { status: 404 },
        payloadTooLarge: { status: 413 },
        serviceUnavailable: { status: 503 },
        tooManyRequests: { status: 429 },
        unauthorized: { status: 401 },
        validationFailed: {
            errorData: validationFailedErrorDataSchema,
            status: 400,
        },
    },
    packLocaleCatalogs,
    (messages) => messages.apiErrors.common,
);
