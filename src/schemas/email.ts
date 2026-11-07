import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { EmailProviderCode } from '../constants/email';
import * as z from '../libs/zod';
import type { EmailProviderConfigByCode } from '../types/email';

export const emailProviderConfigSchemas = {
    [EmailProviderCode.Smtp]: z.object({
        host: z.hostname().trim(),
        password: z.string().min(1).optional(),
        port: z.int().min(1).max(65535),
        secure: z.boolean(),
        tls: z.object({
            rejectUnauthorized: z.boolean(),
            required: z.boolean(),
        }),
        username: z.string().min(1).optional(),
    }),
} satisfies ReadonlyRecord<EmailProviderCode, z.ZodType>;

// Functions
export async function parseEmailProviderConfig<C extends EmailProviderCode>(code: C, input: unknown) {
    return await emailProviderConfigSchemas[code].parseAsync(input) as EmailProviderConfigByCode[C];
}
