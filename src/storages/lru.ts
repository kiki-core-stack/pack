import { LRUCache } from 'lru-cache';

export const lruCache = new LRUCache<string, object>({
    allowStale: false,
    max: 5000,
    ttl: 60 * 60 * 1000,
});
