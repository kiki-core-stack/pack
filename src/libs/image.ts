import type {
    SharpOptions,
    WebpOptions,
} from 'sharp';

import { autoConvertAnimatedImageToWebp } from '../utils/image';

import { uploadFileAndCreateDocument } from './file';
import type { BaseFileStorage } from './storages/files/base';

export async function uploadImageAndCreateFileDocument(
    imageFile: Parameters<typeof autoConvertAnimatedImageToWebp>[0],
    storage: BaseFileStorage,
    convertImageInputOptions?: SharpOptions,
    convertImageOutputOptions?: WebpOptions,
) {
    const convertedImage = await autoConvertAnimatedImageToWebp(
        imageFile,
        convertImageInputOptions,
        convertImageOutputOptions,
    );

    return await uploadFileAndCreateDocument(convertedImage, storage, 'webp');
}
