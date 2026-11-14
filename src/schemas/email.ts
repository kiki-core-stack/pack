import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { EmailProviderCode } from '../constants/email';
import * as z from '../libs/zod';

/**
 * Email provider configs by `code`; `emailProviderConfigVariants.inputSchema(shape)` validates provider inputs.
 */
export const emailProviderConfigVariants = z.discriminatedMap(
    'code',
    'config',
    {
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
    } satisfies ReadonlyRecord<EmailProviderCode, z.ZodType>,
);
