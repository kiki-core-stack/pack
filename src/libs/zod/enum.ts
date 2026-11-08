import { getEnumValues } from '@kikiutils/shared/enum';
import { objectKeys } from 'ts-extras';
import type { ValueOf } from 'type-fest';
import * as z from 'zod';

import { commonStatusToTextMap } from '../../constants';

export function enumWithMeta<T extends Record<string, any>>(
    id: string,
    input: T,
    description?: string,
    toTextMap?: Record<ValueOf<T>, string>,
) {
    let schema = z.enum(input);
    if (description) schema = schema.describe(description);
    const xEnumDescriptions = getEnumValues(input).map((value) => toTextMap?.[value] ?? commonStatusToTextMap[value]);
    const xEnumVarnames = objectKeys(input).filter((key) => Number.isNaN(Number(key)));
    return schema.meta({
        id,
        'x-enum-descriptions': xEnumDescriptions,
        'x-enum-varnames': xEnumVarnames,
    });
}
