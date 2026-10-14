import type { Types } from 'mongoose';

import type { FileDocumentData } from '../../types/data/file';

import { createProjectRedisKeyedStore } from './_internals';

export const documentData = /* @__PURE__ */ createProjectRedisKeyedStore<FileDocumentData>()(
    (id: string | Types.ObjectId, additionalKey?: string) => {
        let key = `file:documentData:${id.toString()}`;
        if (additionalKey) key += `:${additionalKey}`;
        return key;
    },
);
