import type { ReadonlyRecord } from '@kikiutils/shared/types';

export const filePopulateSelectFields: readonly string[] = [
    '-_id',
    'extension',
    'hash',
];

export const fileLookupProjection: ReadonlyRecord<string, boolean> = {
    _id: false,
    extension: true,
    hash: true,
};
