import { validator } from 'hono-openapi';
import type { UnknownRecord } from 'type-fest';

import type { ApiValidationIssue } from '../../../types/data';
import * as apiErrors from '../../api-errors';

import { ApiError } from './error';

interface StandardSchemaIssue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

// Functions

/**
 * `routeValidator` (hono-openapi `validator`) that throws `validationFailed`, so validation errors share the API
 * error format and go through the app error handler.
 */
export const apiValidator = ((target: any, schema: any, hook?: any, options?: any) => validator(
    target,
    schema,
    hook ?? ((result: { error?: readonly StandardSchemaIssue[]; success: boolean }) => {
        if (!result.success) throw toApiValidationError(result.error ?? []);
    }),
    options,
)) as typeof validator;

export function toApiValidationError(issues: readonly StandardSchemaIssue[]) {
    return new ApiError(apiErrors.common.validationFailed, { errorData: { issues: issues.map(toApiValidationIssue) } });
}

function toApiValidationIssue(issue: StandardSchemaIssue): ApiValidationIssue {
    // Zod issues carry `code` and optional `params` at runtime beyond the Standard Schema shape.
    const { code, params } = issue as { code?: unknown; params?: unknown };
    return {
        code: typeof code === 'string' ? code : undefined,
        message: issue.message,
        params: params && typeof params === 'object' ? params as UnknownRecord : undefined,
        path: (issue.path ?? []).map((segment) => {
            const key = typeof segment === 'object' ? segment.key : segment;
            return typeof key === 'number' ? key : String(key);
        }),
    };
}
