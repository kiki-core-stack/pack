import { createLruKeyedStore } from '@kikiutils/shared/storages/lru/keyed-store';

import type { File } from '../../models/file';
import { lruCache } from '../../storages/lru';

/**
 * 依 _id 與序列化後的 projection 存放 File 文件的 toObject() 結果。
 */
export const document = /* @__PURE__ */ createLruKeyedStore<Partial<File>>(lruCache)(
    (id: string, projectionKey: string) => `file:document:${id}:${projectionKey}`,
);
