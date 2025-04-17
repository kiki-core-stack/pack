import { createLruStoreKeyHandler } from '@/libs/storages/lru/factory';
import { lruStorage } from '@/storages/lru';
import type { FileData } from '@/types/data/file';

export const fileData = createLruStoreKeyHandler<Except<FileData, 'createdAt'>>(lruStorage)(
    (id: string) => `fileData:${id}`,
);
