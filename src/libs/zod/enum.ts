import { getEnumValues } from '@kikiutils/shared/enum';
import * as z from 'zod';

import { commonStatusToTextMap } from '../../constants';

export function enumWithMeta<T extends Record<string, any>>(
    id: string,
    input: T,
    description?: string,
    toTextMap?: Record<T[keyof T], string>,
) {
    let schema = z.enum(input);
    if (description) schema = schema.describe(description);
    const xEnumDescriptions = getEnumValues(input).map((value) => toTextMap?.[value] ?? commonStatusToTextMap[value]);
    const xEnumVarnames = Object.keys(input).filter((key) => Number.isNaN(Number(key)));
    return schema.meta({
        id,
        'x-enum-descriptions': xEnumDescriptions,
        'x-enum-varnames': xEnumVarnames,
    });
}
