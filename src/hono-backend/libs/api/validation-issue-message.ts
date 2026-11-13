import {
    en,
    zhTW,
} from 'zod/locales';

import type {
    Locale,
    LocalizedMessages,
} from '../../../types/i18n';

type ZodLocaleError = ReturnType<typeof zhTW>['localeError'];

export interface StandardSchemaIssue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

/**
 * The fields of a Zod issue used for translation; other Standard Schema libraries only provide `message` and `path`.
 */
interface ZodIssueFields {
    code?: string;
    format?: string;
    inclusive?: boolean;
    maximum?: bigint | number;
    minimum?: bigint | number;
    origin?: string;
    params?: { i18n?: LocalizedMessages };
}

// Constants/Variables
/**
 * Per locale: the app's own wording for common issues (`undefined` falls back to the Zod locale).
 */
const localeToIssueMessageOverrideMap: Readonly<Record<Locale, (issue: ZodIssueFields) => string | undefined>> = {
    'en': ({
        code,
        format,
        inclusive,
        maximum,
        minimum,
        origin,
    }) => {
        switch (code) {
            case 'invalid_format':
                if (format === 'email') return 'Enter a valid email address';
                if (format === 'regex') return 'Invalid format';
                if (format === 'url') return 'Enter a valid URL';
                return;
            case 'invalid_type': return 'Enter a valid value';
            case 'invalid_value': return 'Select a valid option';
            case 'too_big':
                if (origin === 'string') return `Must be at most ${maximum} characters`;
                if (origin === 'array' || origin === 'set') return `Select at most ${maximum} items`;
                if (origin === 'number' || origin === 'int' || origin === 'bigint') {
                    return inclusive ? `Must be at most ${maximum}` : `Must be less than ${maximum}`;
                }

                return;
            case undefined: return;
            case 'too_small':
                if (origin === 'string') return minimum === 1 ? 'This field is required' : `Must be at least ${minimum} characters`;
                if (origin === 'array' || origin === 'set') return `Select at least ${minimum} items`;
                if (origin === 'number' || origin === 'int' || origin === 'bigint') {
                    return inclusive ? `Must be at least ${minimum}` : `Must be greater than ${minimum}`;
                }
        }
    },
    'zh-TW': ({
        code,
        format,
        inclusive,
        maximum,
        minimum,
        origin,
    }) => {
        switch (code) {
            case 'invalid_format':
                if (format === 'email') return '請輸入有效的電子郵件';
                if (format === 'regex') return '格式錯誤';
                if (format === 'url') return '請輸入有效的網址';
                return;
            // Issues never include the input, so the Zod message would always say "received undefined".
            case 'invalid_type': return '請輸入有效的值';
            case 'invalid_value': return '請選擇有效的選項';
            case 'too_big':
                if (origin === 'string') return `長度最多 ${maximum} 個字元`;
                if (origin === 'array' || origin === 'set') return `最多 ${maximum} 項`;
                if (origin === 'number' || origin === 'int' || origin === 'bigint') {
                    return inclusive ? `不能大於 ${maximum}` : `必須小於 ${maximum}`;
                }

                return;
            case undefined: return;
            case 'too_small':
                if (origin === 'string') return minimum === 1 ? '此欄位為必填' : `長度至少 ${minimum} 個字元`;
                if (origin === 'array' || origin === 'set') return `至少 ${minimum} 項`;
                if (origin === 'number' || origin === 'int' || origin === 'bigint') {
                    return inclusive ? `不能小於 ${minimum}` : `必須大於 ${minimum}`;
                }
        }
    },
};

const localeToZodLocaleErrorMap: Readonly<Record<Locale, ZodLocaleError>> = {
    'en': en().localeError,
    'zh-TW': zhTW().localeError,
};

// Functions

/**
 * Message of an issue in the locale: a custom check's `i18nIssue` message, the app's wording for common issues, then
 * the Zod locale; non-Zod issues keep their own message.
 */
export function translateValidationIssue(issue: StandardSchemaIssue, locale: Locale) {
    const fields = issue as ZodIssueFields;
    if (fields.params?.i18n) return fields.params.i18n[locale];
    if (!fields.code) return issue.message;
    const message = localeToIssueMessageOverrideMap[locale](fields)
      ?? localeToZodLocaleErrorMap[locale](issue as Parameters<ZodLocaleError>[0]);

    return (typeof message === 'string' ? message : message?.message) ?? issue.message;
}
