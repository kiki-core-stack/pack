import {
    decode,
    encode,
} from 'msgpackr';

import type {
    RedisLikeAdapter,
    RedisLikeStorage,
} from './types';

export function createMsgPackRedisStorage(adapter: RedisLikeAdapter): Readonly<RedisLikeStorage> {
    return Object.freeze({
        async getItem<T = unknown>(key: string) {
            const rawValue = await adapter.getBuffer(key);
            return rawValue ? decode(rawValue) as T : null;
        },
        getItemTtl: (key: string) => adapter.ttl(key),
        hasItem: (key: string) => adapter.has(key),
        removeItem: async (key: string) => await adapter.delete(key) === 1,
        setItem: async (key: string, value: any) => await adapter.setBuffer(key, encode(value)) === 'OK',
        async setItemWithTtl(key: string, ttlSeconds: number, value: any) {
            return await adapter.setBufferEx(key, ttlSeconds, encode(value)) === 'OK';
        },
    });
}
