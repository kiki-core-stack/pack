import type { Nullable } from '@kikiutils/shared/types';
import type { Promisable } from 'type-fest';

export interface RedisLikeAdapter {
    delete: (key: string) => Promisable<number>;
    getBuffer: (key: string) => Promisable<Nullable<Uint8Array>>;
    has: (key: string) => Promisable<boolean>;
    setBuffer: (key: string, value: Uint8Array) => Promisable<'OK' | void>;
    setBufferEx: (key: string, ttlSeconds: number, value: Uint8Array) => Promisable<'OK' | void>;
    ttl: (key: string) => Promisable<number>;
}

export interface RedisLikeStorage {
    getItem: <T = unknown>(key: string) => Promisable<Nullable<T>>;
    getItemTtl: (key: string) => Promisable<number>;
    hasItem: (key: string) => Promisable<boolean>;
    removeItem: (key: string) => Promisable<boolean>;
    setItem: (key: string, value: any) => Promisable<boolean>;
    setItemWithTtl: (key: string, ttlSeconds: number, value: any) => Promisable<boolean>;
}
