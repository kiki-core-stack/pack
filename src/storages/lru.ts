import { LRUCache } from 'lru-cache';

import { createLruStorage } from '../libs/storages/lru/create';

const lruCache = new LRUCache<string, object, unknown>({
    allowStale: false,
    max: 5000,
    ttl: 60 * 60 * 1000,
});

export const lruStorage = createLruStorage(lruCache);
