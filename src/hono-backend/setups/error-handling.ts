import type { Logger } from '@kikiutils/shared/logger/types';
import type {
    Context,
    ErrorHandler,
    Hono,
    NotFoundHandler,
} from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
    mongo,
    Error as MongooseError,
} from 'mongoose';
import {
    objectKeys,
    objectValues,
} from 'ts-extras';

import { AuthError } from '../../libs/auth/error';
import type { AuthErrorCode } from '../../libs/auth/error';
import * as z from '../../libs/zod';
import type { Locale } from '../../types/i18n';
import * as apiErrors from '../api-errors';
import { toApiValidationError } from '../libs/api/_internals/validation';
import { ApiError } from '../libs/api/error';
import { getRequestLocale } from '../middlewares/locale';
import type { ApiErrorDefinition } from '../types/api';

// Constants/Variables
const authErrorCodeToApiErrorMap: Readonly<Record<AuthErrorCode, ApiErrorDefinition>> = {
    ...apiErrors.auth,
    forbidden: apiErrors.common.forbidden,
    unauthorized: apiErrors.common.unauthorized,
};

const mongoServerErrorCodeToApiErrorMap: Readonly<Partial<Record<number, ApiErrorDefinition>>> = {
    6: apiErrors.common.serviceUnavailable, // HostUnreachable
    7: apiErrors.common.serviceUnavailable, // HostNotFound
    50: apiErrors.common.gatewayTimeout, // MaxTimeMSExpired
    89: apiErrors.common.gatewayTimeout, // NetworkTimeout
    13436: apiErrors.common.serviceUnavailable, // NotPrimaryOrSecondary
};

// Common error per status without `errorData`, used for errors that only carry a status code.
const statusToCommonApiErrorMap = new Map<number, ApiErrorDefinition>();
for (const definition of objectValues(apiErrors.common)) {
    if (!definition.errorDataSchema && !statusToCommonApiErrorMap.has(definition.status)) {
        statusToCommonApiErrorMap.set(definition.status, definition);
    }
}

// Functions
function apiErrorToResponse(ctx: Context, error: ApiError, locale = getRequestLocale(ctx)) {
    const requestId = ctx.get('requestId' as never) as string | undefined;
    return ctx.json(error.toResponseData(locale, requestId), error.statusCode);
}

/**
 * Sends every error as the API error format with messages in the request's locale: `ApiError` as is, validation errors
 * as `validationFailed`, known Hono/MongoDB errors as their common errors, and anything else as `internalServerError`.
 *
 * Server errors (5xx) are logged as errors with their cause; client errors (4xx) only at debug level.
 */
export function setupHonoAppErrorHandling(
    honoApp: Hono,
    logger: Logger,
    customErrorHandler?: ErrorHandler,
    customNotFoundHandler?: NotFoundHandler,
) {
    honoApp.notFound(async (ctx) => {
        const customNotFoundHandlerResult = await customNotFoundHandler?.(ctx);
        if (customNotFoundHandlerResult) return customNotFoundHandlerResult;
        return apiErrorToResponse(ctx, new ApiError(apiErrors.common.notFound));
    });

    honoApp.onError(async (error, ctx) => {
        const customErrorHandlerResult = await customErrorHandler?.(error, ctx);
        if (customErrorHandlerResult) return customErrorHandlerResult;
        if (error instanceof HTTPException && error.res) return error.getResponse();

        const locale = getRequestLocale(ctx);
        const apiError = toApiError(error, locale);
        if (apiError.statusCode >= 500) logger.error(error);
        else logger.debug(error);

        return apiErrorToResponse(ctx, apiError, locale);
    });
}

function toApiError(error: unknown, locale: Locale): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof AuthError) {
        return new ApiError(
            authErrorCodeToApiErrorMap[error.code],
            {
                cause: error,
                errorData: error.data,
            },
        );
    }

    if (error instanceof z.ZodError) return toApiValidationError(error.issues, locale);

    if (error instanceof HTTPException) {
        const definition = statusToCommonApiErrorMap.get(error.status);
        if (definition) return new ApiError(definition, { cause: error });
        const fallback = error.status >= 500 ? apiErrors.common.internalServerError : apiErrors.common.badRequest;
        return new ApiError(fallback, { cause: error });
    }

    // An invalid ObjectId looked up by _id (e.g. findById with a route param) cannot match any document.
    if (error instanceof MongooseError.CastError && error.path === '_id') {
        return new ApiError(apiErrors.common.notFound, { cause: error });
    }

    if (error instanceof mongo.MongoServerError) {
        if (error.code === 11000) {
            return new ApiError(
                apiErrors.common.duplicateKey,
                {
                    cause: error,
                    errorData: { fields: objectKeys(error.keyPattern ?? error.keyValue ?? {}) },
                },
            );
        }

        const definition = typeof error.code === 'number' ? mongoServerErrorCodeToApiErrorMap[error.code] : undefined;
        if (definition) return new ApiError(definition, { cause: error });
    }

    if (error instanceof mongo.MongoNetworkError || error instanceof mongo.MongoServerSelectionError) {
        return new ApiError(apiErrors.common.serviceUnavailable, { cause: error });
    }

    return new ApiError(apiErrors.common.internalServerError, { cause: error });
}
