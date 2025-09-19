import type { ReadonlyRecord } from '@kikiutils/types';

export enum FileStorageProvider {
    Local = 0,
}

export const filePopulateSelectFields: readonly string[] = [
    '-_id',
    'path',
    'provider',
];

export const fileLookupProjection: ReadonlyRecord<string, boolean> = {
    _id: false,
    path: true,
    provider: true,
};
