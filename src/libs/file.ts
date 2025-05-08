import type { Buffer } from 'node:buffer';

import { cryptoSha3256 } from '@kikiutils/shared/crypto-hash';
import { Types } from 'mongoose';

import { FileModel } from '../models/file';
import * as lruStore from '../stores/lru';
import * as redisStore from '../stores/redis';
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
    const lruKeyHandler = onlySelectBaseFields ? lruStore.baseFileData : lruStore.fileData;
    const redisKeyHandler = onlySelectBaseFields ? redisStore.baseFileData : redisStore.fileData;
    let data = lruKeyHandler.getItem(id);
    if (data) return data;
    data = await redisKeyHandler.getItem(id);
    if (data) {
        // @ts-expect-error Ignore this error.
        lruKeyHandler.setItem(data, id);
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
    lruKeyHandler.setItem(fileData, id);
    // @ts-expect-error Ignore this error.
    redisKeyHandler.setItemWithTtl(3600, fileData, id).catch(() => {});
    return fileData;
}

export function populateMongooseDocumentFileFields<Paths = object>() {
    return async function <
        D extends
        | MongooseHydratedDocument<DocType, InstanceMethodsAndOverrides, QueryHelpers>
        | MongooseHydratedDocument<DocType, InstanceMethodsAndOverrides, QueryHelpers>[],
        DocType,
        InstanceMethodsAndOverrides,
        QueryHelpers,
    >(
        document: D,
        fields: Arrayable<string>,
        onlySelectBaseFields: boolean = true,
    ): Promise<D extends any[] ? (Omit<D[number], keyof Paths> & Paths)[] : (Omit<D, keyof Paths> & Paths)> {
        fields = Array.isArray(fields) ? fields : [fields];
        const documents = Array.isArray(document) ? document : [document];
        const documentPromises = documents.map(async (document) => {
            const promises = [...new Set(fields)].map(async (field) => {
                const value = document.get(field);
                if (!value) return;
                if (Array.isArray(value)) {
                    document.set(
                        field,
                        // @ts-expect-error Ignore this error.
                        await Promise.all(value.map((id) => getFileDataWithCache(id, onlySelectBaseFields))),
                    );
                } else {
                    // @ts-expect-error Ignore this error.
                    document.set(field, await getFileDataWithCache(value, onlySelectBaseFields));
                }
            });

            await Promise.all(promises);
            return document;
        });

        const results = await Promise.all(documentPromises);
        // @ts-expect-error Ignore this error.
        return Array.isArray(document) ? results : results[0];
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
