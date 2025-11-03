import type { Buffer } from 'node:buffer';

import type { BinaryInput } from '@kikiutils/shared/types';
import type {
    SharpOptions,
    WebpOptions,
} from 'sharp';

import { uploadFileAndCreateDocument } from '../../libs/file';
import type { BaseFileStorage } from '../../libs/storages/files/base';
import { convertImage } from '../../utils/image';

import { throwApiError } from './api';

const animatedMimeTypes = new Set([
    'image/gif',
    'image/webp',
]);

// TODO: move to utils
export async function uploadImageAndCreateFileDocument(
    imageFile: Exclude<BinaryInput, Buffer>,
    storage: BaseFileStorage,
    convertImageInputOptions?: SharpOptions,
    convertImageOutputOptions?: WebpOptions,
) {
    convertImageInputOptions = {
        animated: animatedMimeTypes.has(imageFile.type),
        ...convertImageInputOptions,
    };

    convertImageOutputOptions = {
        alphaQuality: 85,
        ...convertImageOutputOptions,
    };

    const convertedImage = await convertImage(imageFile, convertImageInputOptions, 'webp', convertImageOutputOptions);
    if (!convertedImage) throwApiError(500);
    const file = await uploadFileAndCreateDocument(convertedImage, storage, 'webp').catch(() => throwApiError(500));
    return file;
}
