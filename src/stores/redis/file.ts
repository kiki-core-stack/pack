import { createRedisKeyedStore } from '@kikiutils/shared/storages/redis/keyed-store';

import { redisMsgpackStorage } from '../../storages/redis/msgpack';
import type { FileDocumentData } from '../../types/data/file';

export const fileDocumentData = /* @__PURE__ */ createRedisKeyedStore<FileDocumentData>(redisMsgpackStorage)(
    (id: string, additionalKey?: string) => {
        let key = `fileDocumentData:${id}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
