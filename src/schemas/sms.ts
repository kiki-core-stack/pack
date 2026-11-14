import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { SmsProviderCode } from '../constants/sms';
import * as z from '../libs/zod';

/**
 * SMS provider configs by `code`; `smsProviderConfigVariants.inputSchema(shape)` validates provider inputs.
 */
export const smsProviderConfigVariants = z.discriminatedMap(
    'code',
    'config',
    {
        [SmsProviderCode.Mitake]: z.object({
            apiUrl: z.url().trim(),
            password: z.string().trim().min(1).regex(/^[a-z0-9]+$/i),
            username: z.string().trim().min(1).regex(/^[a-z0-9]+$/i),
        }),
        [SmsProviderCode.TwSms]: z.object({
            apiUrl: z.url().trim(),
            password: z.string().trim().min(1).regex(/^[a-z0-9]+$/i),
            username: z.string().trim().min(1).regex(/^[a-z0-9]+$/i),
        }),
    } satisfies ReadonlyRecord<SmsProviderCode, z.ZodType>,
);
