import type en from './en';

/**
 * The messages pack defines, one catalog per locale in this directory (`<locale>.ts`). `en` is the reference: its
 * shape is the type, it checks enum coverage inline, and the other locales `satisfies` it. Frontends load the current
 * locale's catalog as vue-i18n messages (`$t('enums.common.status.7')`), so messages only use `{name}` placeholders and
 * never the other vue-i18n special characters (`@ $ |`).
 */
export type PackMessages = typeof en;
