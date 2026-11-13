import type { LocalizedMessages } from '../../types/i18n';

/**
 * Issue params giving a custom check (`refine`/`superRefine`) its localized message, translated per request by the API
 * validator, e.g. `.refine(isValid, i18nIssue({ 'en': 'Invalid format', 'zh-TW': '格式錯誤' }))`.
 */
export function i18nIssue(messages: LocalizedMessages) {
    return { params: { i18n: messages } };
}
