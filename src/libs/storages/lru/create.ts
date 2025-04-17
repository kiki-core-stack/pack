import type { LRUCache } from 'lru-cache';

export function createLruStorage(lruInstance: LRUCache<string, object, unknown>) {
    return {
        getItem<T>(key: string) {
            const value = lruInstance.get(key);
            return value === undefined ? null : value as T;
        },
        getItemTtl: (key: string) => lruInstance.getRemainingTTL(key),
        hasItem: (key: string) => lruInstance.has(key),
        get instance() {
            return lruInstance;
        },
        removeItem: (key: string) => lruInstance.delete(key),
        setItem: (key: string, value: any) => lruInstance.set(key, value),
    };
}
