import type { PathLike } from '@kikiutils/classes/path';
import type { Blob } from 'node:buffer';
import type {
    Sharp,
    SharpOptions,
} from 'sharp';

import { getAcceptedImageFileMimeType } from '@/utils/file';
import { convertAndSaveImageFile } from '@/utils/image';

export async function convertAndSaveImageFileOrThrowError(
    file: Blob,
    savePath: PathLike,
    inputOptions?: SharpOptions,
    outputFormat: Parameters<Sharp['toFormat']>[0] = 'webp',
    outputOptions?: Parameters<Sharp['toFormat']>[1],
) {
    if (!await convertAndSaveImageFile(file, savePath, inputOptions, outputFormat, outputOptions)) throwAPIError();
}

export async function validateImageFileMimeTypeAndSize(file: Blob, acceptGif?: boolean, ignoreFileSize?: boolean) {
    const fileMimeType = await getAcceptedImageFileMimeType(file, acceptGif);
    if (!fileMimeType) throwAPIError(400);
    if (!ignoreFileSize && file.size > 1048576 * 16) throwAPIError(413); // Max 16MB
    return fileMimeType;
}
