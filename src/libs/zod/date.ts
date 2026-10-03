import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import * as z from 'zod';

export const strictIsoDate = () => strictIsoDateString().transform((value) => new EnhancedDate(value));

export function strictIsoDateString() {
    return z
        .string()
        .check((ctx) => {
            const date = new EnhancedDate(ctx.value);
            if (date.isValid() && ctx.value === date.toISOString()) return;
            ctx.issues.push({
                code: 'invalid_format',
                format: 'iso8601',
                input: ctx.value,
                message: 'Invalid ISO 8601 date string',
            });
        });
}
