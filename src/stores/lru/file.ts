import { createLruKeyedStore } from '@kikiutils/shared/storages/lru/keyed-store';

import { lruCache } from '../../storages/lru';
import type { FileDocumentData } from '../../types/data/file';

export const documentData = /* @__PURE__ */ createLruKeyedStore<FileDocumentData>(lruCache)(
    (id: string, additionalKey?: string) => {
        let key = `file:documentData:${id}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
