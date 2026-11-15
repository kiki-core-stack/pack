import type { Context } from 'hono';
import { validator } from 'hono-openapi';

import { defaultLocale } from '../../../constants/i18n';
import type { ValidationFailedErrorData } from '../../../types/api';
import type {
    Locale,
    LocalizedMessages,
} from '../../../types/i18n';
import * as apiErrors from '../../api-errors';
import { getRequestLocale } from '../../middlewares/locale';

import { toApiValidationError } from './_internals/validation';
import type { StandardSchemaIssue } from './_internals/validation';
import { ApiError } from './error';

// Classes

/**
 * `validationFailed` for one field whose message is translated when the response is built, so it can be thrown
 * without the request context.
 */
class FieldValidationApiError extends ApiError<typeof apiErrors.common.validationFailed> {
    readonly #localizedMessage: LocalizedMessages;
    readonly #path: Array<number | string>;

    constructor(path: Array<number | string>, localizedMessage: LocalizedMessages) {
        super(
            apiErrors.common.validationFailed,
            { errorData: createFieldValidationErrorData(path, localizedMessage[defaultLocale]) },
        );

        this.#localizedMessage = localizedMessage;
        this.#path = path;
    }

    override toResponseData(locale: Locale, requestId?: string) {
        return {
            ...super.toResponseData(locale, requestId),
            errorData: createFieldValidationErrorData(this.#path, this.#localizedMessage[locale]),
        };
    }
}

// Functions

/**
 * `routeValidator` (hono-openapi `validator`) that throws `validationFailed` with the issues translated into the
 * request's locale, so validation errors share the API error format and go through the app error handler.
 */
export const apiValidator = ((target: any, schema: any, hook?: any, options?: any) => validator(
    target,
    schema,
    hook ?? ((result: { error?: readonly StandardSchemaIssue[]; success: boolean }, ctx: Context) => {
        if (!result.success) throw toApiValidationError(result.error ?? [], getRequestLocale(ctx));
    }),
    options,
)) as typeof validator;

function createFieldValidationErrorData(path: Array<number | string>, message: string): ValidationFailedErrorData {
    return {
        issues: [
            {
                code: 'custom',
                message,
                path,
            },
        ],
    };
}

/**
 * Throws `validationFailed` for one field, like a schema issue at `path`, for checks that need data beyond the input
 * (e.g. the stored password).
 */
export function throwFieldValidationError(path: Array<number | string>, message: LocalizedMessages): never {
    throw new FieldValidationApiError(path, message);
}
