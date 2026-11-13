import * as z from '../libs/zod';

export const apiValidationIssueSchema = z.object({
    /**
     * Schema issue code (Zod: `too_small`, `invalid_format`, `custom`...).
     */
    code: z.string().optional(),

    /**
     * Message in the request's locale.
     */
    message: z.string(),
    path: z.array(z.union([
        z.number(),
        z.string(),
    ])),
});

export const duplicateKeyErrorDataSchema = z.object({ fields: z.array(z.string()) });
export const validationFailedErrorDataSchema = z.object({ issues: z.array(apiValidationIssueSchema) });
