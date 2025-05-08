import { createKeyedLruStore } from '@kikiutils/shared/storage/lru/keyed-store';

import { lruCache } from '../storages/lru';
import type {
    BaseFileData,
    FileData,
} from '../types/data/file';

export const baseFileData = createKeyedLruStore<BaseFileData>(lruCache)((id: string) => `baseFileData:${id}`);
export const fileData = createKeyedLruStore<FileData>(lruCache)((id: string) => `fileData:${id}`);
