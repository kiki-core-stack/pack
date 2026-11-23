import {
    en,
    zhTW,
} from 'zod/locales';

import { packLocaleCatalogs } from '../../../../i18n/catalogs';
import type { PackMessages } from '../../../../i18n/messages/types';
import type {
    ApiValidationIssue,
    ValidationFailedErrorData,
} from '../../../../types/api';
import type {
    Locale,
    LocalizedMessage,
} from '../../../../types/i18n';
import * as apiErrors from '../../../api-errors';
import { ApiError } from '../error';

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
    params?: { i18n?: LocalizedMessage };
}

// Constants/Variables
const localeToZodLocaleErrorMap: Readonly<Record<Locale, ZodLocaleError>> = {
    'en': en().localeError,
    'zh-TW': zhTW().localeError,
};

/**
 * Fills `{name}` placeholders, the vue-i18n named interpolation syntax that every catalog uses.
 */
function formatMessage(message: string, params?: Readonly<Record<string, bigint | number | string>>) {
    if (!params) return message;
    return message.replaceAll(/\{(\w+)\}/g, (placeholder, name: string) => String(params[name] ?? placeholder));
}

// Functions
export function toApiValidationError(issues: readonly StandardSchemaIssue[], locale: Locale) {
    const errorData: ValidationFailedErrorData = { issues: issues.map((issue) => toApiValidationIssue(issue, locale)) };
    return new ApiError(apiErrors.common.validationFailed, { errorData });
}

function toApiValidationIssue(issue: StandardSchemaIssue, locale: Locale): ApiValidationIssue {
    const { code } = issue as { code?: string };
    return {
        code,
        message: translateValidationIssue(issue, locale),
        path: (issue.path ?? []).map((segment) => {
            const key = typeof segment === 'object' ? segment.key : segment;
            return typeof key === 'number' ? key : String(key);
        }),
    };
}

function toCommonIssueMessage(
    {
        code,
        format,
        inclusive,
        maximum,
        minimum,
        origin,
    }: ZodIssueFields,
    messages: PackMessages['validation']['common'],
) {
    const isNumber = origin === 'number' || origin === 'int' || origin === 'bigint';
    switch (code) {
        case 'invalid_format':
            if (format === 'email' || format === 'regex' || format === 'url') return messages.invalidFormat[format];
            return;
        // Issues never include the input, so the Zod message would always say "received undefined".
        case 'invalid_type': return messages.invalidType;
        case 'invalid_value': return messages.invalidValue;
        case 'too_big':
            if (maximum === undefined) return;
            if (origin === 'string') return formatMessage(messages.tooBig.string, { maximum });
            if (origin === 'array' || origin === 'set') return formatMessage(messages.tooBig.items, { maximum });
            if (isNumber) {
                return formatMessage(inclusive ? messages.tooBig.number : messages.tooBig.numberExclusive, { maximum });
            }

            return;
        case undefined: return;
        case 'too_small':
            if (minimum === undefined) return;
            if (origin === 'string') {
                return minimum === 1 ? messages.required : formatMessage(messages.tooSmall.string, { minimum });
            }

            if (origin === 'array' || origin === 'set') return formatMessage(messages.tooSmall.items, { minimum });
            if (isNumber) {
                return formatMessage(
                    inclusive ? messages.tooSmall.number : messages.tooSmall.numberExclusive,
                    { minimum },
                );
            }
    }
}

/**
 * Message of an issue in the locale: a custom check's `i18nIssue` message, pack's wording for common issues, then
 * the Zod locale; non-Zod issues keep their own message.
 */
function translateValidationIssue(issue: StandardSchemaIssue, locale: Locale) {
    const fields = issue as ZodIssueFields;
    if (fields.params?.i18n) return fields.params.i18n[locale];
    if (!fields.code) return issue.message;
    const commonIssueMessage = toCommonIssueMessage(fields, packLocaleCatalogs[locale].validation.common);
    if (commonIssueMessage) return commonIssueMessage;
    const message = localeToZodLocaleErrorMap[locale](issue as Parameters<ZodLocaleError>[0]);
    return (typeof message === 'string' ? message : message?.message) ?? issue.message;
}
