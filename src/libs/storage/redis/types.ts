import type { Nullable } from '@kikiutils/shared/types';

export interface RedisLikeAdapter {
    delete: (key: string) => Promise<number>;
    getBuffer: (key: string) => Promise<Nullable<Uint8Array>>;
    has: (key: string) => Promise<boolean>;
    setBuffer: (key: string, value: Uint8Array) => Promise<'OK' | void>;
    setBufferEx: (key: string, ttlSeconds: number, value: Uint8Array) => Promise<'OK' | void>;
    ttl: (key: string) => Promise<number>;
}

export interface RedisLikeStorage {
    getItem: <T = unknown>(key: string) => Promise<Nullable<T>>;
    getItemTtl: (key: string) => Promise<number>;
    hasItem: (key: string) => Promise<boolean>;
    removeItem: (key: string) => Promise<boolean>;
    setItem: (key: string, value: any) => Promise<boolean>;
    setItemWithTtl: (key: string, ttlSeconds: number, value: any) => Promise<boolean>;
}
