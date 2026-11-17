import { authFactors } from '../constants/auth';
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

/**
 * `errorData` of `verificationRequired`: the operation to verify for and the factors the account can verify with.
 */
export const authVerificationRequiredErrorDataSchema = z.object({
    factors: z.array(z.enum(authFactors)),
    operation: z.string(),
});

export const duplicateKeyErrorDataSchema = z.object({ fields: z.array(z.string()) });
export const validationFailedErrorDataSchema = z.object({ issues: z.array(apiValidationIssueSchema) });
