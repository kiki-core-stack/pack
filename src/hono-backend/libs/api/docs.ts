import { upperFirst } from 'es-toolkit';
import * as z from 'zod';

import { defaultLocale } from '../../../constants/i18n';
import type { ApiErrorDefinition } from '../../types/api';

// Constants

// Schemas with a meta `id` become shared OpenAPI components, so each error and the data-less success response are
// documented (and generated into client types) once instead of inline in every route.
const apiErrorResponseSchemas = new WeakMap<ApiErrorDefinition, z.ZodObject>();
const dataLessSuccessResponseSchema = z.object({ success: z.literal(true) }).meta({ id: 'ApiSuccessResponse' });

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
    if (!dataSchema) return dataLessSuccessResponseSchema;
    return z.object({
        data: dataSchema,
        success: z.literal(true),
    });
}

/**
 * The response schema of an API error, created once per definition as the component `<Code>ApiError` (the suffix keeps
 * it apart from other component ids such as enums); codes are unique across a backend's errors.
 */
function toApiErrorResponseSchema(definition: ApiErrorDefinition) {
    let schema = apiErrorResponseSchemas.get(definition);
    if (!schema) {
        schema = z
            .object({
                errorCode: z.literal(definition.code),
                ...definition.errorDataSchema ? { errorData: definition.errorDataSchema } : {},
                message: z.string(),
                requestId: z.string().optional(),
                success: z.literal(false),
            })
            .meta({
                description: definition.message[defaultLocale],
                id: `${upperFirst(definition.code)}ApiError`,
            });

        apiErrorResponseSchemas.set(definition, schema);
    }

    return schema;
}
