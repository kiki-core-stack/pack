import * as z from 'zod';

import type { ApiErrorDefinition } from '../../types/api';

// Functions
/**
 * Builds route docs responses for API errors, grouped by status.
 *
 * Errors sharing a status become a union discriminated by `errorCode`; each branch keeps its code and description.
 * Pass all errors of a route in one call: spreading several calls overwrites responses with the same status.
 *
 * @example
 * ```ts
 * defineRoute({ docs: { responses: { ...apiErrorResponses(apiErrors.common.notFound) } } })
 * ```
 */
export function apiErrorResponses(...definitions: ApiErrorDefinition[]) {
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

function toApiErrorResponseSchema(definition: ApiErrorDefinition) {
    return z
        .object({
            errorCode: z.literal(definition.code),
            ...definition.dataSchema ? { errorData: definition.dataSchema } : {},
            message: z.string().optional(),
            requestId: z.string().optional(),
            success: z.literal(false),
        })
        .meta({
            description: definition.description,
            title: definition.code,
        });
}
