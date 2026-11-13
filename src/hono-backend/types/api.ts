import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type * as z from 'zod';

import type { LocalizedMessages } from '../../types/i18n';

export type ApiErrorArgs<Definition extends ApiErrorDefinition> = undefined extends ApiErrorDataOf<Definition>
    ? [options?: ApiErrorOptions<ApiErrorDataOf<Definition>>]
    : [options: ApiErrorOptions<ApiErrorDataOf<Definition>> & { errorData: ApiErrorDataOf<Definition> }];

export type ApiErrorDataOf<Definition extends ApiErrorDefinition> =
    Definition extends ApiErrorDefinition<string, infer D> ? D : never;

export type ApiErrorDefinitions<Inputs extends Record<string, ApiErrorDefinitionInput>> = {
    readonly [Code in keyof Inputs & string]: ApiErrorDefinition<
        Code,
        Inputs[Code]['errorData'] extends z.ZodType ? z.output<Inputs[Code]['errorData']> : undefined
    >;
};

export interface ApiErrorDefinition<Code extends string = string, Data = unknown> {
    readonly code: Code;

    /**
     * Schema of the `errorData` field, used for docs and typing.
     */
    readonly errorDataSchema?: z.ZodType<Data>;

    /**
     * Message sent to clients in the request's locale; also the route docs description.
     */
    readonly message: LocalizedMessages;
    readonly status: ContentfulStatusCode;
}

export interface ApiErrorDefinitionInput {
    errorData?: z.ZodType;
    message: LocalizedMessages;
    status: ContentfulStatusCode;
}

export interface ApiErrorOptions<Data = unknown> {
    /**
     * Original error; logged but never sent to the client.
     */
    cause?: unknown;
    errorData?: Data;

    /**
     * Detail for the server log; never sent to the client, which gets the definition's localized message.
     */
    message?: string;
}
