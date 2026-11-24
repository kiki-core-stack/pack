import type { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';

import { toBuffer } from '@kikiutils/shared/buffer';
import type { BinaryInput } from '@kikiutils/shared/types';
import { fileTypeFromBuffer } from 'file-type';
import { mongo } from 'mongoose';
import sharp from 'sharp';

import { FileModel } from '../../models/file';
import { getFileStorage } from '../storages/files';

import { getPublicFileKey } from './public';

// Functions
async function getImageData(buffer: Buffer) {
    const metadata = await sharp(buffer, { animated: true }).metadata().catch(
        // An image MIME type sharp cannot decode is still stored, just without dimensions.
        () => undefined,
    );

    if (!metadata?.width || !metadata.height) return;
    // Dimensions as displayed: EXIF orientation applied, and one frame of an animated image.
    const { height, width } = metadata.autoOrient;
    return {
        height: metadata.pages && metadata.pages > 1 && metadata.pageHeight ? metadata.pageHeight : height,
        width,
    };
}

/**
 * Stores a public file; identical content is stored once: an existing document with the same hash is returned as is.
 */
export async function uploadFileAndCreateDocument(input: BinaryInput) {
    const buffer = await toBuffer(input);
    const hash = createHash('sha256').update(buffer).digest('hex');
    const existingFile = await FileModel.findOne({ hash });
    if (existingFile) return existingFile;
    const fileType = await fileTypeFromBuffer(buffer);
    const mimeType = fileType?.mime.toLowerCase() ?? 'application/octet-stream';
    const fileData = {
        extension: fileType?.ext,
        hash,
        image: mimeType.startsWith('image/') ? await getImageData(buffer) : undefined,
        mimeType,
        size: buffer.length,
    };

    await getFileStorage('public').write(getPublicFileKey(fileData), buffer, { type: mimeType });
    try {
        return await FileModel.create(fileData);
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
