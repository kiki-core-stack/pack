import type {
    Context,
    Hono,
} from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { MongoServerError } from 'mongodb';
import {
    ZodError,
    ZodIssueCode,
} from 'zod';

import { ApiError } from '../libs/api/error';

const badRequestError = new ApiError(400);
const isDebugMode = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
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
const payloadTooLargeError = new ApiError(413);

// TODO: Use string perf for response
export function setupHonoAppErrorHandling(honoApp: Hono, logger: { error: (...args: any[]) => any }) {
    const apiErrorToResponse = (ctx: Context, error: ApiError) => ctx.json(error.responseData, error.statusCode);
    honoApp.notFound((ctx) => apiErrorToResponse(ctx, notFoundError));
    honoApp.onError((error, ctx) => {
        if (error instanceof ApiError) {
            if (isDebugMode) logger.error(error);
            return apiErrorToResponse(ctx, error);
        }

        if (error instanceof ZodError) {
            if (isDebugMode) logger.error(error);
            const isPayloadTooLarge = error.issues.some((issue) => {
                return issue.code === ZodIssueCode.custom && issue.params?.reason === 'fileTooLarge';
            });

            if (isPayloadTooLarge) return apiErrorToResponse(ctx, payloadTooLargeError);
            return apiErrorToResponse(ctx, badRequestError);
        }

        logger.error(error);
        let statusCode: ContentfulStatusCode = 500;
        if (error instanceof MongoServerError && error.code) {
            statusCode = mongodbErrorCodeToHttpStatusCodeMap[error.code] || 500;
        }

        return apiErrorToResponse(ctx, new ApiError(statusCode));
    });
}
