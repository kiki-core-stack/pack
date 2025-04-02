import { ApiError } from '../libs/api/error';
import { defineApiErrorMapByErrorCode } from '../libs/api/index';

export const defaultApiErrors = defineApiErrorMapByErrorCode([
    new ApiError(400, '資料格式錯誤或非法操作！', 'badRequest'),
    new ApiError(500, '系統錯誤！', 'internalServerError'),
]);
