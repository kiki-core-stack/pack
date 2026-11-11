import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type * as z from 'zod';

export type ApiErrorArgs<Definition extends ApiErrorDefinition> = undefined extends ApiErrorDataOf<Definition>
    ? [options?: ApiErrorOptions<ApiErrorDataOf<Definition>>]
    : [options: ApiErrorOptions<ApiErrorDataOf<Definition>> & { data: ApiErrorDataOf<Definition> }];

export type ApiErrorDataOf<Definition extends ApiErrorDefinition> =
    Definition extends ApiErrorDefinition<string, infer D> ? D : never;

export type ApiErrorDefinitions<Inputs extends Record<string, ApiErrorDefinitionInput>> = {
    readonly [Code in keyof Inputs & string]: ApiErrorDefinition<
        Code,
        Inputs[Code]['data'] extends z.ZodType ? z.output<Inputs[Code]['data']> : undefined
    >;
};

export interface ApiErrorDefinition<Code extends string = string, Data = unknown> {
    readonly code: Code;

    /**
     * Schema of the `data` field, used for docs and data typing.
     */
    readonly dataSchema?: z.ZodType<Data>;
    readonly description?: string;
    readonly status: ContentfulStatusCode;
}

export interface ApiErrorDefinitionInput {
    data?: z.ZodType;
    description?: string;
    status: ContentfulStatusCode;
}

export interface ApiErrorOptions<Data = unknown> {
    /**
     * Original error; logged but never sent to the client.
     */
    cause?: unknown;
    data?: Data;

    /**
     * Extra detail for debugging; clients should translate by `errorCode` instead.
     */
    message?: string;
}
