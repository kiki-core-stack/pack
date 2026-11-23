import { selectLocaleCatalogs } from '../../i18n/catalogs';
import type { LocaleCatalogs } from '../../types/i18n';

/**
 * Issue params giving a custom check (`refine`/`superRefine`) its localized message, translated per request by the API
 * validator, e.g. `.refine(isValid, i18nIssue(appLocaleCatalogs, (m) => m.validation.invalidCode))`.
 */
export function i18nIssue<T>(catalogs: LocaleCatalogs<T>, select: (messages: T) => string) {
    return { params: { i18n: selectLocaleCatalogs(catalogs, select) } };
}
