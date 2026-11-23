import type { ReadonlyRecord } from '@kikiutils/shared/types';
import type { ArrayValues } from 'type-fest';

import type { localeDefinitions } from '../i18n/locales';

export type Locale = ArrayValues<typeof localeDefinitions>['code'];
export type LocaleCatalogs<T> = ReadonlyRecord<Locale, T>;

/**
 * A message in every supported locale, held server-side until the request's locale is known (API error definitions,
 * issue params); built from catalogs with `selectLocaleCatalogs`.
 */
export type LocalizedMessage = LocaleCatalogs<string>;
