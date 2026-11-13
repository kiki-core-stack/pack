import type { ArrayValues } from 'type-fest';

import type { supportedLocales } from '../constants/i18n';

export type Locale = ArrayValues<typeof supportedLocales>;

/**
 * A message in every supported locale, so adding a locale makes each untranslated message a type error.
 */
export type LocalizedMessages = Readonly<Record<Locale, string>>;
