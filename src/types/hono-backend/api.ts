import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type {
    output,
    ZodObject,
} from 'zod';

export interface FixedApiErrorThrower<S extends ContentfulStatusCode, E extends string, DataSchema extends ZodObject> {
    (data?: output<DataSchema>, message?: string): never;
    dataSchema: DataSchema;
    errorCode: E;
    statusCode: S;
}
