import type { FileDocumentData } from '../../types/data/file';

import { createProjectRedisKeyedStore } from './_internals';

export const documentData = /* @__PURE__ */ createProjectRedisKeyedStore<FileDocumentData>()(
    (id: string, additionalKey?: string) => {
        let key = `file:documentData:${id}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
