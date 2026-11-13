import type { Context } from 'hono';
import { validator } from 'hono-openapi';

import type {
    ApiValidationIssue,
    ValidationFailedErrorData,
} from '../../../types/data';
import type { Locale } from '../../../types/i18n';
import * as apiErrors from '../../api-errors';
import { getRequestLocale } from '../../middlewares/locale';

import { ApiError } from './error';
import { translateValidationIssue } from './validation-issue-message';
import type { StandardSchemaIssue } from './validation-issue-message';

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

export function toApiValidationError(issues: readonly StandardSchemaIssue[], locale: Locale) {
    const errorData: ValidationFailedErrorData = { issues: issues.map((issue) => toApiValidationIssue(issue, locale)) };
    return new ApiError(apiErrors.common.validationFailed, { errorData });
}

function toApiValidationIssue(issue: StandardSchemaIssue, locale: Locale): ApiValidationIssue {
    const { code } = issue as { code?: string };
    return {
        code,
        message: translateValidationIssue(issue, locale),
        path: (issue.path ?? []).map((segment) => {
            const key = typeof segment === 'object' ? segment.key : segment;
            return typeof key === 'number' ? key : String(key);
        }),
    };
}
