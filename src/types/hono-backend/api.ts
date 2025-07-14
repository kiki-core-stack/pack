import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type {
    output,
    ZodObject,
} from 'zod';

export interface FixedApiErrorThrower<S extends ContentfulStatusCode, E extends string, DS extends ZodObject> {
    (data?: output<DS>, message?: string): never;
    dataSchema: DS;
    errorCode: E;
    statusCode: S;
}
