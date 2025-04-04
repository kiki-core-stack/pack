import { ApiError } from '../libs/api/error';
import { defineApiErrorMapByErrorCode } from '../libs/api/index';

export const defaultApiErrors = defineApiErrorMapByErrorCode([
    new ApiError(400, undefined, 'badRequest'),
    new ApiError(404, undefined, 'notFound'),
    new ApiError(413, undefined, 'payloadTooLarge'),
    new ApiError(500, undefined, 'internalServerError'),
]);
