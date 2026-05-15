import {
    describe,
    it,
} from 'vitest';

import {
    createApiSuccessResponseData,
    throwApiError,
} from '../../../../src/hono-backend/libs/api';
import { ApiError } from '../../../../src/hono-backend/libs/api/error';

describe.concurrent('api response helpers', () => {
    it('should create success response data with optional data and message', ({ expect }) => {
        expect(createApiSuccessResponseData({ id: '1' }, 'ok')).toStrictEqual({
            data: { id: '1' },
            message: 'ok',
            success: true,
        });
    });

    it('should throw ApiError instances', ({ expect }) => {
        expect(() => throwApiError(403, 'forbiddenAction', { action: 'delete' })).toThrow(ApiError);
        try {
            throwApiError(403, 'forbiddenAction', { action: 'delete' });
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            if (error instanceof ApiError) {
                expect(error.statusCode).toBe(403);
                expect(error.errorCode).toBe('forbiddenAction');
                expect(error.data).toStrictEqual({ action: 'delete' });
            }
        }
    });
});
