import type { Blob } from 'node:buffer';

import type {
    SharpOptions,
    WebpOptions,
} from 'sharp';

import { uploadFileAndCreateRecord } from '@/libs/file';
import type { BaseFileStorage } from '@/libs/storages/files/base';
import { convertImage } from '@/utils/image';

import { throwApiError } from './api';

export async function uploadImageAndCreateRecord(
    imageFile: Blob,
    storage: BaseFileStorage,
    convertImageInputOptions?: SharpOptions,
    convertImageOutputOptions?: WebpOptions,
) {
    convertImageInputOptions = {
        animated: imageFile.type === 'image/gif',
        ...convertImageInputOptions,
    };

    convertImageOutputOptions = {
        alphaQuality: 85,
        ...convertImageOutputOptions,
    };

    const convertedImage = await convertImage(imageFile, convertImageInputOptions, 'webp', convertImageOutputOptions);
    if (!convertedImage) throwApiError(500);
    const file = await uploadFileAndCreateRecord(convertedImage, storage);
    if (!file) throwApiError(500);
    return file;
}
