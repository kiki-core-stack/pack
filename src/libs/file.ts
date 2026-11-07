import { toBuffer } from '@kikiutils/shared/buffer';
import { cryptoSha3256 } from '@kikiutils/shared/crypto-hash';
import type { BinaryInput } from '@kikiutils/shared/types';
import { mongo } from 'mongoose';

import { FileModel } from '../models/file';

import type { BaseFileStorage } from './storages/files/base';
import * as z from './zod';

export function fileIdSchema() {
    return z.objectId().check(async (ctx) => {
        if (await FileModel.exists({ _id: ctx.value })) return;
        ctx.issues.push({
            code: 'custom',
            input: ctx.value,
            message: 'File not found',
            params: { reason: 'fileNotFound' },
        });
    });
}

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
            throw new Error(
                `DuplicateKey error occurred, but file with hash ${hash} was not found in the database`,
                { cause: error },
            );
        }

        throw error;
    }
}
