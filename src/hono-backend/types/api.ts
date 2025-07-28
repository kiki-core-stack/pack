import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type {
    output,
    ZodObject,
} from 'zod';

import type { ApiError } from '../libs/api/error';

export interface FixedApiErrorCreator<S extends ContentfulStatusCode, E extends string, DataSchema extends ZodObject> {
    (data?: output<DataSchema>, message?: string): ApiError<output<DataSchema>, E>;
    dataSchema: DataSchema;
    defaultMessage: string;
    errorCode: E;
    statusCode: S;
}
