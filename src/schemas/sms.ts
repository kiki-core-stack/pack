import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { SmsProviderCode } from '../constants/sms';
import * as z from '../libs/zod';

export const smsProviderConfigSchemas = {
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
} satisfies ReadonlyRecord<SmsProviderCode, z.ZodType>;

// Functions

/**
 * SMS provider input schema: the given fields plus `code` and the `config` of that code, so config issues are reported
 * under `config.*` like any other field.
 */
export function createSmsProviderInputSchema<Shape extends z.ZodRawShape>(shape: Shape) {
    return z.discriminatedUnion(
        'code',
        [
            z.object({
                ...shape,
                code: z.literal(SmsProviderCode.Mitake),
                config: smsProviderConfigSchemas[SmsProviderCode.Mitake],
            }),
            z.object({
                ...shape,
                code: z.literal(SmsProviderCode.TwSms),
                config: smsProviderConfigSchemas[SmsProviderCode.TwSms],
            }),
        ],
    );
}
