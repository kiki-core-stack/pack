import {
    defaultLocale,
    supportedLocales,
} from '../constants/i18n';
import type { Locale } from '../types/i18n';

// Functions

/**
 * Picks the supported locale that best matches an `Accept-Language` header: by quality, an exact tag first and then
 * the same language (`zh` or `zh-HK` → `zh-TW`), falling back to the default locale.
 */
export function resolveLocale(acceptLanguage?: string): Locale {
    if (!acceptLanguage) return defaultLocale;
    const tags = acceptLanguage
        .split(',')
        .map((part) => {
            const [tag = '', ...params] = part.trim().split(';');
            const qualityParam = params.find((param) => param.trim().startsWith('q='));
            const quality = qualityParam ? Number(qualityParam.trim().slice(2)) : 1;
            return {
                quality: Number.isNaN(quality) ? 0 : quality,
                tag: tag.trim().toLowerCase(),
            };
        })
        .filter(({ quality, tag }) => tag && quality > 0)
        .toSorted((a, b) => b.quality - a.quality);

    for (const { tag } of tags) {
        const language = tag.split('-')[0];
        const locale = supportedLocales.find((locale) => locale.toLowerCase() === tag)
          ?? supportedLocales.find((locale) => locale.toLowerCase().split('-')[0] === language);

        if (locale) return locale;
    }

    return defaultLocale;
}
