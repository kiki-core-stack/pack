import { createLruStoreKeyHandler } from '../libs/storages/lru/factory';
import { lruStorage } from '../storages/lru';
import type {
    BaseFileData,
    FileData,
} from '../types/data/file';

export const baseFileData = createLruStoreKeyHandler<BaseFileData>(lruStorage)(
    (id: string) => `baseFileData:${id}`,
);

export const fileData = createLruStoreKeyHandler<FileData>(lruStorage)(
    (id: string) => `fileData:${id}`,
);
