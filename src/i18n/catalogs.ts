import { mapValues } from 'es-toolkit';

import type { LocaleCatalogs } from '../types/i18n';

import en from './messages/en';
import type { PackMessages } from './messages/types';
import zhTW from './messages/zh-TW';

/**
 * Every locale's pack catalog. Frontends import only `messages/<locale>` instead, so they load one locale at a time.
 */
export const packLocaleCatalogs: LocaleCatalogs<PackMessages> = {
    'en': en,
    'zh-TW': zhTW,
};

// Functions

export function selectLocaleCatalogs<T, R>(catalogs: LocaleCatalogs<T>, select: (messages: T) => R): LocaleCatalogs<R> {
    return mapValues(catalogs, select);
}
