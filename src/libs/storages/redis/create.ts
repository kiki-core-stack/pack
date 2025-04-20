import { Buffer } from 'node:buffer';

import { Redis } from 'ioredis';
import {
    deserialize,
    serialize,
} from 'superjson';

enum StorageValueEncodingType {
    Buffer = 0,
    Json = 1,
    String = 2,
}

const customValueHeader = Buffer.of(
    0xE2,
    0x81,
    0xA0,
);

const customValueHeaderLength = customValueHeader.byteLength + 1;

export function createRedisStorage(ioRedisInstanceOrUri: Redis | string) {
    const instance = ioRedisInstanceOrUri instanceof Redis ? ioRedisInstanceOrUri : new Redis(ioRedisInstanceOrUri);
    return {
        disconnect: () => instance.disconnect(),
        async getItem<T>(key: string) {
            const rawValue = await instance.getBuffer(key);
            return rawValue ? decodeStorageValue(rawValue) as T : null;
        },
        getItemTtl: (key: string) => instance.ttl(key),
        hasItem: async (key: string) => await instance.exists(key) === 1,
        get instance() {
            return instance;
        },
        removeItem: (key: string) => instance.del(key),
        setItem: (key: string, value: any) => instance.set(key, encodeToStorageValue(value)),
        setItemWithTtl(key: string, seconds: number, value: any) {
            return instance.setex(key, seconds, encodeToStorageValue(value));
        },
    };
}

function encodeToStorageValue(value: any) {
    if (Buffer.isBuffer(value)) return toCustomValue(StorageValueEncodingType.Buffer, value);
    if (typeof value === 'string') return toCustomValue(StorageValueEncodingType.String, Buffer.from(value));
    return toCustomValue(StorageValueEncodingType.Json, Buffer.from(JSON.stringify(serialize(value))));
}

function decodeStorageValue(buffer: Buffer) {
    if (!isCustomFormat(buffer)) return buffer;
    const payload = buffer.subarray(customValueHeaderLength);
    const type = buffer[customValueHeader.byteLength];
    switch (type) {
        case StorageValueEncodingType.Buffer: return payload;
        case StorageValueEncodingType.Json:
            try {
                return deserialize(JSON.parse(payload.toString()));
            } catch {
                throw new Error('[RedisStorage] Failed to parse JSON payload.');
            }
        case StorageValueEncodingType.String: return payload.toString();
        default:
            throw new Error(`[RedisStorage] Unknown encoding type: ${type}.`);
    }
}

function isCustomFormat(buffer: Buffer) {
    return (
        buffer.length >= customValueHeaderLength
        && buffer[0] === customValueHeader[0]
        && buffer[1] === customValueHeader[1]
        && buffer[2] === customValueHeader[2]
    );
}

function toCustomValue(type: StorageValueEncodingType, payload: Buffer) {
    return Buffer.concat([
        customValueHeader,
        Buffer.of(type),
        payload,
    ]);
}
