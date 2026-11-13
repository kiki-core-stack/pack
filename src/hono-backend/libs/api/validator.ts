import { validator } from 'hono-openapi';
import {
    objectEntries,
    objectKeys,
} from 'ts-extras';
import type { UnknownRecord } from 'type-fest';

import type { ApiValidationIssue } from '../../../types/data';
import * as apiErrors from '../../api-errors';

import { ApiError } from './error';

interface StandardSchemaIssue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

// Constants/Variables
// Issue fields that are standard, nested, internal or carry the input; everything else is sent as `details`.
const nonDetailIssueKeys = new Set([
    'code',
    'continue',
    'errors',
    'input',
    'inst',
    'issues',
    'message',
    'path',
    'schema',
]);

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
    // Zod issues carry `code` and per-code fields at runtime beyond the Standard Schema shape.
    const details: UnknownRecord = {};
    for (const [key, value] of objectEntries(issue as unknown as UnknownRecord)) {
        if (!nonDetailIssueKeys.has(key) && value !== undefined) details[key] = toJsonSafeValue(value);
    }

    const { code } = issue as { code?: unknown };
    return {
        code: typeof code === 'string' ? code : undefined,
        details: objectKeys(details).length ? details : undefined,
        message: issue.message,
        path: (issue.path ?? []).map((segment) => {
            const key = typeof segment === 'object' ? segment.key : segment;
            return typeof key === 'number' ? key : String(key);
        }),
    };
}

// BigInt bounds and values (e.g. `z.bigint().min()`) are not JSON serializable.
function toJsonSafeValue(value: unknown): unknown {
    if (typeof value === 'bigint') return value.toString();
    return Array.isArray(value) ? value.map(toJsonSafeValue) : value;
}
