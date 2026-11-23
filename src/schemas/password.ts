import { packLocaleCatalogs } from '../i18n/catalogs';
import * as z from '../libs/zod';

/**
 * Strong password policy for privileged accounts (e.g. admins). Not trimmed: surrounding whitespace is rejected instead
 * of silently removed.
 */
export const strongPasswordSchema = z
    .string()
    .refine(
        (value) => value.length >= 12,
        z.i18nIssue(packLocaleCatalogs, (messages) => messages.validation.password.tooShort),
    )
    .refine(
        (value) => /^\S(?:.*\S)?$/.test(value),
        z.i18nIssue(packLocaleCatalogs, (messages) => messages.validation.password.leadingOrTrailingWhitespace),
    )
    .refine(
        (value) => /[A-Z]/.test(value),
        z.i18nIssue(packLocaleCatalogs, (messages) => messages.validation.password.missingUppercase),
    )
    .refine(
        (value) => /[a-z]/.test(value),
        z.i18nIssue(packLocaleCatalogs, (messages) => messages.validation.password.missingLowercase),
    )
    .refine(
        (value) => /\d/.test(value),
        z.i18nIssue(packLocaleCatalogs, (messages) => messages.validation.password.missingDigit),
    )
    .refine(
        (value) => /[^0-9a-z]/i.test(value),
        z.i18nIssue(packLocaleCatalogs, (messages) => messages.validation.password.missingSpecialCharacter),
    );
