import type { Buffer } from 'node:buffer';

import { cryptoSha3256 } from '@kikiutils/node/crypto-hash';
import { pick } from 'lodash-es';
import { Types } from 'mongoose';

import { FileModel } from '@/models/file';
import * as lruStore from '@/stores/lru';
import * as redisStore from '@/stores/redis';
import type {
    BaseFileData,
    FileData,
} from '@/types/data/file';

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
    const lruKeyHandler = onlySelectBaseFields ? lruStore.baseFileData : lruStore.fileData;
    let data = lruKeyHandler.getItem(id);
    if (data) return data;
    const redisKeyHandler = onlySelectBaseFields ? redisStore.baseFileData : redisStore.fileData;
    data = await redisKeyHandler.getItem(id);
    if (data) return data;
    const file = await FileModel.findById(id).lean();
    if (!file) return null;
    const fileData = onlySelectBaseFields ? pick(file, 'provider', 'path') : file;
    // @ts-expect-error Ignore this error.
    lruKeyHandler.setItem(fileData, id);
    // @ts-expect-error Ignore this error.
    redisKeyHandler.setItemWithTtl(3600, fileData, id).catch(() => {});
    return fileData;
}

export function populateMongooseDocumentFileFields<Paths = object>() {
    return async function <
        D extends MongooseHydratedDocument<DocType, InstanceMethodsAndOverrides, QueryHelpers>,
        DocType,
        InstanceMethodsAndOverrides,
        QueryHelpers,
    >(
        document: D,
        fields: Arrayable<string>,
        onlySelectBaseFields: boolean = true,
    ) {
        fields = Array.isArray(fields) ? fields : [fields];
        const promises = [...new Set(fields)].map(async (field) => {
            const value = document.get(field);
            if (!value) return;
            if (Array.isArray(value)) {
                document.set(
                    field,
                    // @ts-expect-error Ignore this error.
                    await Promise.all(value.map((id) => getFileDataWithCache(id, onlySelectBaseFields))),
                );
            } else document.set(field, await getFileDataWithCache(value));
        });

        await Promise.all(promises);
        return document as unknown as Omit<D, keyof Paths> & Paths;
    };
}

export async function uploadFileAndCreateDocument(buffer: Buffer, storage: BaseFileStorage) {
    const hash = cryptoSha3256(buffer);
    const file = await FileModel.findOne({ hash });
    if (file) return file;
    const uploadResult = await storage.upload(buffer);
    if (!uploadResult.ok) throw uploadResult.error;
    return await FileModel.create(uploadResult.value);
}
