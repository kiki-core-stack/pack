import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { SmsProviderCode } from '../constants/sms';
import * as z from '../libs/zod';
import type { SmsProviderConfigByCode } from '../types/sms';

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
export async function parseSmsProviderConfig<C extends SmsProviderCode>(code: C, input: unknown) {
    return await smsProviderConfigSchemas[code].parseAsync(input) as SmsProviderConfigByCode[C];
}
