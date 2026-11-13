import {
    objectEntries,
    objectValues,
} from 'ts-extras';

import type { ApiErrorResponseData } from '../../../types/data';
import type { Locale } from '../../../types/i18n';
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
 * Defines API errors keyed by error code; each key becomes the `errorCode` sent to clients.
 *
 * @example
 * ```ts
 * export const { otpTooManyAttempts } = defineApiErrors({
 *     otpTooManyAttempts: { message: { 'en': 'Too many attempts', 'zh-TW': '驗證碼嘗試次數過多' }, status: 429 },
 * });
 * ```
 */
export function defineApiErrors<const Inputs extends Record<string, ApiErrorDefinitionInput>>(inputs: Inputs) {
    const definitions: Record<string, ApiErrorDefinition> = {};
    for (const [code, { errorData, ...input }] of objectEntries(inputs)) {
        definitions[code] = Object.freeze({
            ...input,
            code,
            errorDataSchema: errorData,
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
