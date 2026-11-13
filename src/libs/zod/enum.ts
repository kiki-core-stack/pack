import { objectEntries } from 'ts-extras';
import type { ValueOf } from 'type-fest';
import * as z from 'zod';

import { defaultLocale } from '../../constants/i18n';
import type { LocalizedMessages } from '../../types/i18n';

type EnumLike = Readonly<Record<string, number | string>>;

// Functions

/**
 * Enum schema registered as a shared OpenAPI component (`id`), documenting each value via `x-enum-varnames` and
 * `x-enum-descriptions` (`toLabelMap` label in the default locale, falling back to the enum key).
 *
 * Pass `commonStatusToLabelMap` for status enums built from `CommonStatus` values. Numeric strings are accepted for
 * numeric values, so it also works for query and form inputs. Create it once per enum and reuse it; describe each field
 * at the use site with `.describe()`.
 */
export function enumWithMeta<T extends EnumLike>(
    id: string,
    input: T,
    toLabelMap?: Readonly<Partial<Record<ValueOf<T>, LocalizedMessages>>>,
) {
    // Numeric TS enums also map values back to keys; keep only the named members.
    const members = objectEntries<EnumLike>(input).filter(([key]) => Number.isNaN(Number(key)));
    const numericValues = new Set(members.flatMap(([, value]) => typeof value === 'number' ? [value] : []));
    const labelMap: Readonly<Partial<Record<number | string, LocalizedMessages>>> = toLabelMap ?? {};
    const schema = z.enum(input).meta({
        id,
        'x-enum-descriptions': members.map(([key, value]) => labelMap[value]?.[defaultLocale] ?? key),
        'x-enum-varnames': members.map(([key]) => key),
    });

    return z.preprocess(
        (value) => {
            if (typeof value !== 'string' || !value.trim()) return value;
            const numericValue = Number(value);
            return numericValues.has(numericValue) ? numericValue : value;
        },
        schema,
    );
}
