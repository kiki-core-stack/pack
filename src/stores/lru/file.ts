import { createLruKeyedStore } from '@kikiutils/shared/storages/lru/keyed-store';
import type { Types } from 'mongoose';

import { lruCache } from '../../storages/lru';
import type { FileDocumentData } from '../../types/data/file';

export const documentData = /* @__PURE__ */ createLruKeyedStore<FileDocumentData>(lruCache)(
    (id: string | Types.ObjectId, additionalKey?: string) => {
        let key = `file:documentData:${id.toString()}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
