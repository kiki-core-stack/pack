import * as z from 'zod';

/**
 * Makes the schema optional and treats a blank string (empty or whitespace only) as absent, so clients can send the
 * value of an empty form field as is.
 */
export function blankToUndefined<T extends z.ZodType>(schema: T) {
    return z.preprocess((value) => typeof value === 'string' && !value.trim() ? undefined : value, schema.optional());
}
