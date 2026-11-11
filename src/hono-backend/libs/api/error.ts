import { objectEntries } from 'ts-extras';

import type { ApiErrorResponseData } from '../../../types/data';
import type {
    ApiErrorArgs,
    ApiErrorDataOf,
    ApiErrorDefinition,
    ApiErrorDefinitionInput,
    ApiErrorDefinitions,
} from '../../types/api';

// Classes
export class ApiError<Definition extends ApiErrorDefinition = ApiErrorDefinition> extends Error {
    readonly data: ApiErrorDataOf<Definition>;
    readonly definition: Definition;

    constructor(definition: Definition, ...[options]: ApiErrorArgs<Definition>) {
        super(options?.message?.trim() ?? '', { cause: options?.cause });
        this.data = options?.data as ApiErrorDataOf<Definition>;
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
    toResponseData(requestId?: string): ApiErrorResponseData<Definition['code'], ApiErrorDataOf<Definition>> {
        return {
            data: this.data,
            errorCode: this.errorCode,
            message: this.message || undefined,
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
 *     otpTooManyAttempts: { description: '驗證碼嘗試次數過多', status: 429 },
 * });
 * ```
 */
export function defineApiErrors<const Inputs extends Record<string, ApiErrorDefinitionInput>>(inputs: Inputs) {
    const definitions: Record<string, ApiErrorDefinition> = {};
    for (const [code, { data, ...input }] of objectEntries(inputs)) {
        definitions[code] = Object.freeze({
            ...input,
            code,
            dataSchema: data,
        });
    }

    return definitions as ApiErrorDefinitions<Inputs>;
}

export function throwApiError<Definition extends ApiErrorDefinition>(
    definition: Definition,
    ...args: ApiErrorArgs<Definition>
): never {
    throw new ApiError(definition, ...args);
}
