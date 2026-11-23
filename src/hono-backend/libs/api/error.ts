import {
    objectEntries,
    objectValues,
} from 'ts-extras';

import { selectLocaleCatalogs } from '../../../i18n/catalogs';
import type { ApiErrorResponseData } from '../../../types/api';
import type {
    Locale,
    LocaleCatalogs,
} from '../../../types/i18n';
import type {
    ApiErrorArgs,
    ApiErrorDataOf,
    ApiErrorDefinition,
    ApiErrorDefinitionInput,
    ApiErrorDefinitions,
} from '../../types/api';

// Classes
export class ApiError<Definition extends ApiErrorDefinition = ApiErrorDefinition> extends Error {
    readonly errorData: ApiErrorDataOf<Definition>;
    readonly definition: Definition;

    constructor(definition: Definition, ...[options]: ApiErrorArgs<Definition>) {
        super(options?.message?.trim() ?? '', { cause: options?.cause });
        this.errorData = options?.errorData as ApiErrorDataOf<Definition>;
        this.definition = definition;
        this.name = 'ApiError';
    }

    // Public getter
    get errorCode(): Definition['code'] {
        return this.definition.code;
    }

    get statusCode() {
        return this.definition.status;
    }

    // Public methods
    toResponseData(locale: Locale, requestId?: string): ApiErrorResponseData<Definition['code'], ApiErrorDataOf<Definition>> {
        return {
            errorCode: this.errorCode,
            errorData: this.errorData,
            message: this.definition.message[locale],
            requestId,
            success: false,
        };
    }
}

// Functions

/**
 * Defines API errors keyed by error code; each key becomes the `errorCode` sent to clients, and its message comes from
 * the same key in each locale's catalog section of the layer that defines the errors.
 *
 * @example
 * ```ts
 * export const { otpTooManyAttempts } = defineApiErrors(
 *     { otpTooManyAttempts: { status: 429 } },
 *     appLocaleCatalogs,
 *     (messages) => messages.apiErrors.otp,
 * );
 * ```
 */
export function defineApiErrors<
    const Inputs extends Record<string, ApiErrorDefinitionInput>,
    T,
    CodeMessages extends Readonly<Record<keyof Inputs & string, string>>,
>(
    inputs: Inputs,
    catalogs: LocaleCatalogs<T>,
    // Messages for undefined codes are type errors as well, so removed errors leave no stale messages.
    select: (messages: T) => CodeMessages & Readonly<Record<Exclude<keyof CodeMessages, keyof Inputs>, never>>,
) {
    const codeCatalogs = selectLocaleCatalogs(catalogs, select);
    const definitions: Record<string, ApiErrorDefinition> = {};
    for (const [code, { errorData, ...input }] of objectEntries(inputs)) {
        definitions[code] = Object.freeze({
            ...input,
            code,
            errorDataSchema: errorData,
            message: selectLocaleCatalogs(codeCatalogs, (messages) => messages[code]),
        });
    }

    return definitions as ApiErrorDefinitions<Inputs>;
}

/**
 * Lists the sorted error codes of a backend's error namespaces (its `apiErrors`), throwing when two different
 * definitions share a code: the code is the only identifier clients see (responses, translations).
 */
export function listApiErrorCodes(namespaces: Readonly<Record<string, Readonly<Record<string, ApiErrorDefinition>>>>) {
    const codeToDefinitionMap = new Map<string, ApiErrorDefinition>();
    for (const namespace of objectValues(namespaces)) {
        for (const definition of objectValues(namespace)) {
            const registeredDefinition = codeToDefinitionMap.get(definition.code);
            if (registeredDefinition && registeredDefinition !== definition) {
                throw new Error(`Duplicate API error code "${definition.code}"`);
            }

            codeToDefinitionMap.set(definition.code, definition);
        }
    }

    return [...codeToDefinitionMap.keys()].toSorted();
}

export function throwApiError<Definition extends ApiErrorDefinition>(
    definition: Definition,
    ...args: ApiErrorArgs<Definition>
): never {
    throw new ApiError(definition, ...args);
}
