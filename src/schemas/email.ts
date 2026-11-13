import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { EmailProviderCode } from '../constants/email';
import * as z from '../libs/zod';

export const emailProviderConfigSchemas = {
    [EmailProviderCode.Smtp]: z.object({
        host: z.hostname().trim(),
        password: z.blankToUndefined(z.string()),
        port: z.int().min(1).max(65535),
        secure: z.boolean(),
        tls: z.object({
            rejectUnauthorized: z.boolean(),
            required: z.boolean(),
        }),
        username: z.blankToUndefined(z.string()),
    }),
} satisfies ReadonlyRecord<EmailProviderCode, z.ZodType>;

// Functions

/**
 * Email provider input schema: the given fields plus `code` and the `config` of that code, so config issues are
 * reported under `config.*` like any other field.
 */
export function createEmailProviderInputSchema<Shape extends z.ZodRawShape>(shape: Shape) {
    return z.discriminatedUnion(
        'code',
        [
            z.object({
                ...shape,
                code: z.literal(EmailProviderCode.Smtp),
                config: emailProviderConfigSchemas[EmailProviderCode.Smtp],
            }),
        ],
    );
}
