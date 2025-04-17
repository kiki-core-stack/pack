import { Buffer } from 'node:buffer';

import { Redis } from 'ioredis';
import {
    deserialize,
    serialize,
} from 'superjson';

enum RedisValueEncodingType {
    Buffer = 0,
    Json = 1,
    String = 2,
}

const customValueHeader = Buffer.of(
    0xAB,
    0x01,
    0x01,
);

const customValueHeaderLength = 4;

export function createRedisStorage(ioRedisInstanceOrUri: Redis | string) {
    const instance = ioRedisInstanceOrUri instanceof Redis ? ioRedisInstanceOrUri : new Redis(ioRedisInstanceOrUri);
    return {
        disconnect: () => instance.disconnect(),
        async getItem<T>(key: string) {
            const rawValue = await instance.getBuffer(key);
            return rawValue ? decodeBufferValue(rawValue) as T : null;
        },
        getItemTtl: (key: string) => instance.ttl(key),
        hasItem: (key: string) => instance.exists(key),
        get instance() {
            return instance;
        },
        removeItem: (key: string) => instance.del(key),
        setItem: (key: string, value: any) => instance.set(key, encodeValueToBuffer(value)),
        setItemWithTtl: (key: string, seconds: number, value: any) => {
            return instance.setex(key, seconds, encodeValueToBuffer(value));
        },
    };
}

function encodeValueToBuffer(value: any) {
    if (Buffer.isBuffer(value)) return toCustomValue(RedisValueEncodingType.Buffer, value);
    if (typeof value === 'string') return toCustomValue(RedisValueEncodingType.String, Buffer.from(value));
    return toCustomValue(RedisValueEncodingType.Json, Buffer.from(JSON.stringify(serialize(value))));
}

function decodeBufferValue(buffer: Buffer) {
    if (!isCustomFormat(buffer)) return buffer;
    const payload = buffer.subarray(customValueHeaderLength);
    const type = buffer[3];
    switch (type) {
        case RedisValueEncodingType.Buffer: return payload;
        case RedisValueEncodingType.Json:
            try {
                return deserialize(JSON.parse(payload.toString()));
            } catch {
                throw new Error('[RedisStorage] Failed to parse JSON payload.');
            }
        case RedisValueEncodingType.String: return payload.toString();
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

function toCustomValue(type: RedisValueEncodingType, payload: Buffer) {
    return Buffer.concat([
        customValueHeader,
        Buffer.of(type),
        payload,
    ]);
}
