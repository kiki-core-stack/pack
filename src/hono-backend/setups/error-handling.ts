import logger from '@kikiutils/node/consola';
import type { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { MongoServerError } from 'mongodb';
import { ZodError } from 'zod';

import { statusCodeToApiResponseTextMap } from '../constants/response';
import { ApiError } from '../libs/api/error';

const mongodbErrorCodeToHttpStatusCodeMap = Object.freeze<Dict<ContentfulStatusCode>>({
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
});

export function setupHonoAppErrorHandling(honoApp: Hono) {
    honoApp.notFound((ctx) => {
        ctx.header('content-type', 'application/json');
        return ctx.body(statusCodeToApiResponseTextMap[404]!, 404);
    });

    honoApp.onError((error, ctx) => {
        ctx.header('content-type', 'application/json');
        if (error instanceof ApiError) {
            return ctx.body(
                JSON.stringify({
                    data: error.data,
                    errorCode: error.errorCode,
                    message: error.message,
                    success: false,
                }),
                error.statusCode,
            );
        }

        logger.error(error);
        if (error instanceof ZodError) return ctx.body(statusCodeToApiResponseTextMap[400]!, 400);
        let statusCode: ContentfulStatusCode = 500;
        if (error instanceof MongoServerError && error.code) {
            statusCode = mongodbErrorCodeToHttpStatusCodeMap[error.code] || 500;
        }

        return ctx.body(statusCodeToApiResponseTextMap[statusCode]!, statusCode);
    });
}
