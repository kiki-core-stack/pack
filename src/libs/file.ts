import type { Buffer } from 'node:buffer';

import { cryptoSha3256 } from '@kikiutils/shared/crypto-hash';
import { Types } from 'mongoose';

import { FileModel } from '../models/file';
import * as enhancedRedisStore from '../stores/enhanced/redis';
import * as lruStore from '../stores/lru';
import type {
    BaseFileData,
    FileData,
} from '../types/data/file';

import type { BaseFileStorage } from './storages/files/base';

export async function getFileDataWithCache(id: string | Types.ObjectId): Promise<Nullable<FileData>>;
export async function getFileDataWithCache(
    id: string | Types.ObjectId, onlySelectBaseFields: true
): Promise<Nullable<BaseFileData>>;
export async function getFileDataWithCache(
    id: string | Types.ObjectId, onlySelectBaseFields: false
): Promise<Nullable<FileData>>;
export async function getFileDataWithCache(id: string | Types.ObjectId, onlySelectBaseFields?: boolean) {
    id = id instanceof Types.ObjectId ? id.toHexString() : id;
    const lruKeyStore = onlySelectBaseFields ? lruStore.baseFileData : lruStore.fileData;
    const redisKeyStore = onlySelectBaseFields ? enhancedRedisStore.baseFileData : enhancedRedisStore.fileData;
    let data = lruKeyStore.getItem(id);
    if (data) return data;
    data = await redisKeyStore.getItem(id);
    if (data) {
        lruKeyStore.setItem(data, id);
        return data;
    }

    const file = await FileModel.findById(id).lean();
    if (!file) return null;
    const fileData = onlySelectBaseFields
        ? {
            id: file._id.toHexString(),
            path: file.path,
            provider: file.provider,
        }
        : file;

    // @ts-expect-error Ignore this error.
    lruKeyStore.setItem(fileData, id);
    // @ts-expect-error Ignore this error.
    redisKeyStore.setItemWithTtl(3600, fileData, id).catch(() => {});
    return fileData;
}

export async function uploadFileAndCreateDocument(buffer: Buffer, storage: BaseFileStorage) {
    const hash = cryptoSha3256(buffer);
    const file = await FileModel.findOne({ hash });
    if (file) return file;
    const uploadResult = await storage.upload(buffer);
    if (!uploadResult.ok) throw uploadResult.error;
    return await FileModel.create(uploadResult.value);
}
