import {
    describe,
    it,
} from 'vitest';

import { ApiError } from '../../../../src/hono-backend/libs/api/error';

describe.concurrent('api error', () => {
    it('should map known status codes to response error codes', ({ expect }) => {
        const error = new ApiError(404);

        expect(error.statusCode).toBe(404);
        expect(error.errorCode).toBe('notFound');
        expect(error.responseData).toStrictEqual({
            data: undefined,
            errorCode: 'notFound',
            message: undefined,
            success: false,
        });
    });

    it('should use explicit error code, data and trimmed message', ({ expect }) => {
        const error = new ApiError(409, 'duplicateAccount', { account: 'root' }, '  Already exists  ');

        expect(error.responseData).toStrictEqual({
            data: { account: 'root' },
            errorCode: 'duplicateAccount',
            message: 'Already exists',
            success: false,
        });
    });

    it('should fall back to unknown client, server and generic error codes', ({ expect }) => {
        expect(new ApiError(418).errorCode).toBe('unknownClientError');
        expect(new ApiError(502).errorCode).toBe('unknownServerError');
        expect(new ApiError(302 as any).errorCode).toBe('unknownError');
    });
});
