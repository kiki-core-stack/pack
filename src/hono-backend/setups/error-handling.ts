import type { ReadonlyRecord } from '@kikiutils/types';
import type {
    Context,
    ErrorHandler,
    Hono,
    NotFoundHandler,
} from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { MongoServerError } from 'mongodb';
import { ZodError } from 'zod';

import { isDebugMode } from '../../constants';
import { ApiError } from '../libs/api/error';

// Constants
const mongodbErrorCodeToHttpStatusCodeMap: ReadonlyRecord<string, ContentfulStatusCode> = {
    2: 400, // BadValue -> Bad Request
    4: 404, // NoSuchKey -> Not Found
    6: 503, // HostUnreachable -> Service Unavailable
    7: 503, // HostNotFound -> Service Unavailable
    9: 400, // FailedToParse -> Bad Request
    13: 401, // Unauthorized -> Unauthorized
    14: 400, // TypeMismatch -> Bad Request
    16: 400, // InvalidLength -> Bad Request
    20: 400, // IllegalOperation -> Bad Request
    22: 400, // InvalidBSON -> Bad Request
    24: 504, // LockTimeout -> Gateway Timeout
    26: 404, // NamespaceNotFound -> Not Found
    27: 404, // IndexNotFound -> Not Found
    50: 504, // MaxTimeMSExpired -> Gateway Timeout
    66: 400, // ImmutableField -> Bad Request
    72: 400, // InvalidOptions -> Bad Request
    73: 400, // InvalidNamespace -> Bad Request
    89: 504, // NetworkTimeout -> Gateway Timeout
    11000: 409, // DuplicateKey -> Conflict
    13297: 409, // DatabaseDifferCase -> Conflict
    13436: 503, // NotPrimaryOrSecondary -> Service Unavailable
    14031: 507, // OutOfDiskSpace -> Insufficient Storage
    16755: 400, // Location16755 -> Bad Request
};

const notFoundError = new ApiError(404);

// Functions
export function setupHonoAppErrorHandling(
    honoApp: Hono,
    logger: { error: (...args: any[]) => any },
    customErrorHandler?: ErrorHandler,
    customNotFoundHandler?: NotFoundHandler,
) {
    const apiErrorToResponse = (ctx: Context, error: ApiError) => ctx.json(error.responseData, error.statusCode);
    honoApp.notFound(async (ctx) => {
        const customNotFoundHandlerResult = await customNotFoundHandler?.(ctx);
        if (customNotFoundHandlerResult) return customNotFoundHandlerResult;
        return apiErrorToResponse(ctx, notFoundError);
    });

    honoApp.onError(async (error, ctx) => {
        const customErrorHandlerResult = await customErrorHandler?.(error, ctx);
        if (customErrorHandlerResult) return customErrorHandlerResult;

        if (error instanceof ApiError) {
            if (isDebugMode) logger.error(error);
            return apiErrorToResponse(ctx, error);
        }

        if (error instanceof ZodError) {
            if (isDebugMode) logger.error(error);
            return ctx.json({ issues: error.issues }, 400);
        }

        logger.error(error);
        let statusCode: ContentfulStatusCode = 500;
        if (error instanceof MongoServerError && error.code) {
            statusCode = mongodbErrorCodeToHttpStatusCodeMap[error.code] || 500;
        }

        return apiErrorToResponse(ctx, new ApiError(statusCode));
    });
}
