import type { Buffer } from 'node:buffer';

import { cryptoSha3256 } from '@kikiutils/node/crypto-hash';
import { omit } from 'lodash-es';
import { Types } from 'mongoose';

import { FileModel } from '@/models/file';
import * as lruStore from '@/stores/lru';
import * as redisStore from '@/stores/redis';
import type { FileData } from '@/types/data/file';

import type { BaseFileStorage } from './storages/files/base';

export async function getFileDataWithCache(id: string | Types.ObjectId) {
    id = id instanceof Types.ObjectId ? id.toHexString() : id;
    let data = lruStore.fileData.getItem(id);
    if (data) return data;
    data = await redisStore.fileData.getItem(id);
    if (data) return data;
    const file = await FileModel.findById(id);
    if (!file) return null;
    const fileData = omit(file.toJSON() as unknown as FileData, 'createdAt');
    lruStore.fileData.setItem(fileData, id);
    redisStore.fileData.setItem(fileData, id).catch(() => {});
    return fileData;
}

export function populateFileFields<Paths = object>() {
    return async function <
        D extends MongooseHydratedDocument<DocType, InstanceMethodsAndOverrides, QueryHelpers>,
        DocType,
        InstanceMethodsAndOverrides,
        QueryHelpers,
    >(document: D, fields: Arrayable<string>) {
        fields = Array.isArray(fields) ? fields : [fields];
        const promises = [...new Set(fields)].map(async (field) => {
            const value = document.get(field);
            if (!field) return;
            if (Array.isArray(value)) document.set(field, await Promise.all(value.map(getFileDataWithCache)));
            else document.set(field, await getFileDataWithCache(value));
        });

        await Promise.all(promises);
        return document as unknown as Omit<D, keyof Paths> & Paths;
    };
}

export async function uploadFileAndCreateRecord(buffer: Buffer, storage: BaseFileStorage) {
    const hash = cryptoSha3256(buffer);
    const file = await FileModel.findOne({ hash });
    if (file) return file;
    const uploadResult = await storage.upload(buffer);
    if (!uploadResult.ok) return;
    return await FileModel.create(uploadResult.value);
}
