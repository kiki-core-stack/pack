import * as z from 'zod';

import { defaultLocale } from '../../../constants/i18n';
import type { ApiErrorDefinition } from '../../types/api';

// Functions
/**
 * Builds route docs responses for API errors, grouped by status; use as `apiDocs.errors` (`export * as apiDocs`).
 * Prefer `apiDocs.responses`, which also documents the success response.
 *
 * Errors sharing a status become a union discriminated by `errorCode`; each branch keeps its code and (default locale)
 * message.
 * Pass all errors of a route in one call: spreading several calls overwrites responses with the same status.
 *
 * @example
 * ```ts
 * defineRoute({ docs: { responses: { ...apiDocs.errors(apiErrors.common.notFound) } } })
 * ```
 */
export function errors(...definitions: ApiErrorDefinition[]) {
    const statusToSchemasMap = new Map<number, z.ZodObject[]>();
    for (const definition of new Set(definitions)) {
        const schemas = statusToSchemasMap.get(definition.status) ?? [];
        schemas.push(toApiErrorResponseSchema(definition));
        statusToSchemasMap.set(definition.status, schemas);
    }

    const responses: Record<number, z.ZodType> = {};
    for (const [status, schemas] of statusToSchemasMap) {
        responses[status] = schemas.length === 1
            ? schemas[0]!
            : z.discriminatedUnion('errorCode', schemas as [z.ZodObject, ...z.ZodObject[]]);
    }

    return responses;
}

function isApiErrorDefinition(value: ApiErrorDefinition | z.ZodType): value is ApiErrorDefinition {
    return 'code' in value && 'status' in value;
}

/**
 * Builds the route docs responses of a `200` success response, with the data schema if any, and the route's API errors.
 * Use `apiDocs.success` and `apiDocs.errors` directly for another success status.
 *
 * @example
 * ```ts
 * defineRoute({ docs: { responses: apiDocs.responses(responseDataSchema, apiErrors.common.notFound) } })
 * defineRoute({ docs: { responses: apiDocs.responses(apiErrors.common.notFound) } }) // Without data
 * ```
 */
export function responses(...errorDefinitions: ApiErrorDefinition[]): Record<number, z.ZodType>;
export function responses(dataSchema: z.ZodType, ...errorDefinitions: ApiErrorDefinition[]): Record<number, z.ZodType>;
export function responses(...args: Array<ApiErrorDefinition | z.ZodType>) {
    // Checked by shape: downstream may load another zod copy, so `instanceof z.ZodType` is unreliable.
    const [first, ...rest] = args;
    const dataSchema = first && !isApiErrorDefinition(first) ? first : undefined;
    const errorDefinitions = (dataSchema ? rest : args) as ApiErrorDefinition[];
    return {
        200: success(dataSchema),
        ...errors(...errorDefinitions),
    };
}

/**
 * Builds the route docs schema of a success response, matching `ctx.createApiSuccessResponse(data)`; without
 * `dataSchema` it documents a response without data. Use as `apiDocs.success`.
 *
 * @example
 * ```ts
 * defineRoute({ docs: { responses: { 200: apiDocs.success(responseDataSchema) } } })
 * ```
 */
export function success<D extends z.ZodType>(dataSchema?: D) {
    return z.object({
        ...dataSchema ? { data: dataSchema } : {},
        success: z.literal(true),
    });
}

function toApiErrorResponseSchema(definition: ApiErrorDefinition) {
    return z
        .object({
            errorCode: z.literal(definition.code),
            ...definition.errorDataSchema ? { errorData: definition.errorDataSchema } : {},
            message: z.string(),
            requestId: z.string().optional(),
            success: z.literal(false),
        })
        .meta({
            description: definition.message[defaultLocale],
            title: definition.code,
        });
}
