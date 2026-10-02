import { createRedisKeyedStore } from '@kikiutils/shared/storages/redis/keyed-store';

import { redisMsgpackStorage } from '../../storages/redis/msgpack';
import type { FileDocumentData } from '../../types/data/file';

export const documentData = /* @__PURE__ */ createRedisKeyedStore<FileDocumentData>(redisMsgpackStorage)(
    (id: string, additionalKey?: string) => {
        let key = `file:documentData:${id}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
