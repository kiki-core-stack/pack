import { toBuffer } from '@kikiutils/shared/buffer';
import { cryptoSha3256 } from '@kikiutils/shared/crypto-hash';
import type { BinaryInput } from '@kikiutils/shared/types';
import { mongo } from 'mongoose';

import { FileModel } from '../models/file';

import type { BaseFileStorage } from './storages/files/base';

export async function uploadFileAndCreateDocument(input: BinaryInput, storage: BaseFileStorage, extension?: string) {
    const buffer = await toBuffer(input);
    const hash = cryptoSha3256(buffer);
    const file = await FileModel.findOne({ hash });
    if (file) return file;
    const uploadResult = await storage.upload(buffer, undefined, extension);
    if (!uploadResult.ok) throw uploadResult.error;
    try {
        return await FileModel.create(uploadResult.value);
    } catch (error) {
        if (error instanceof mongo.MongoServerError && error.code === 11000) {
            const file = await FileModel.findOne({ hash });
            if (file) return file;
            throw new Error(`DuplicateKey error occurred, but file with hash ${hash} was not found in the database`);
        }

        throw error;
    }
}
