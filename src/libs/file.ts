import type { Buffer } from 'node:buffer';

import { cryptoSha3256 } from '@kikiutils/shared/crypto-hash';

import { FileModel } from '../models/file';

import type { BaseFileStorage } from './storages/files/base';

export async function uploadFileAndCreateDocument(buffer: Buffer, storage: BaseFileStorage, extension?: string) {
    const hash = cryptoSha3256(buffer);
    const file = await FileModel.findOne({ hash });
    if (file) return file;
    const uploadResult = await storage.upload(buffer, undefined, extension);
    if (!uploadResult.ok) throw uploadResult.error;
    return await FileModel.create(uploadResult.value);
}
