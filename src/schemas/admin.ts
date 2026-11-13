import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { AdminLogType } from '../constants/admin';
import * as z from '../libs/zod';
import type { AdminLogMetadataByType } from '../types/admin';

export const adminLogMetadataSchemas = {
    [AdminLogType.LoginFailure]: z.undefined(),
    [AdminLogType.LoginSuccess]: z.undefined(),
} satisfies ReadonlyRecord<AdminLogType, z.ZodType>;

/**
 * Admin password policy. Not trimmed: surrounding whitespace is rejected instead of silently removed.
 */
export const adminPasswordSchema = z
    .string()
    .refine(
        (value) => value.length >= 12,
        z.i18nIssue({
            'en': 'Password must be at least 12 characters',
            'zh-TW': '密碼長度至少 12 個字元',
        }),
    )
    .refine(
        (value) => /^\S(?:.*\S)?$/.test(value),
        z.i18nIssue({
            'en': 'Password cannot start or end with whitespace',
            'zh-TW': '密碼不能以空白開頭或結尾',
        }),
    )
    .refine(
        (value) => /[A-Z]/.test(value),
        z.i18nIssue({
            'en': 'Password must contain an uppercase letter',
            'zh-TW': '密碼至少包含一個大寫字母',
        }),
    )
    .refine(
        (value) => /[a-z]/.test(value),
        z.i18nIssue({
            'en': 'Password must contain a lowercase letter',
            'zh-TW': '密碼至少包含一個小寫字母',
        }),
    )
    .refine(
        (value) => /\d/.test(value),
        z.i18nIssue({
            'en': 'Password must contain a digit',
            'zh-TW': '密碼至少包含一個數字',
        }),
    )
    .refine(
        (value) => /[^0-9a-z]/i.test(value),
        z.i18nIssue({
            'en': 'Password must contain a special character (symbol, emoji, CJK character, etc.)',
            'zh-TW': '密碼至少包含一個特殊字元（可為符號、表情符號、中文等）',
        }),
    );

// Functions
export async function parseAdminLogMetadata<T extends AdminLogType>(type: T, input: unknown) {
    return await adminLogMetadataSchemas[type].parseAsync(input) as AdminLogMetadataByType[T];
}
