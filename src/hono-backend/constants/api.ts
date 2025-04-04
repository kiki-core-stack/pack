import { ApiError } from '../libs/api/error';
import { defineApiErrorMapByErrorCode } from '../libs/api/index';

export const defaultApiErrors = defineApiErrorMapByErrorCode([
    new ApiError(400, undefined, 'badRequest'),
    new ApiError(500, undefined, 'internalServerError'),
]);
