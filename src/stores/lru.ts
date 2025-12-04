import { createLruKeyedStore } from '@kikiutils/shared/storages/lru/keyed-store';

import { lruCache } from '../storages/lru';
import type { FileDocumentData } from '../types/data/file';

export const fileDocumentData = /* @__PURE__ */ createLruKeyedStore<FileDocumentData>(lruCache)(
    (id: string, additionalKey?: string) => {
        let key = `fileDocumentData:${id}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
