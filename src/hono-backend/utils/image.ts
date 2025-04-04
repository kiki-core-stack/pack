import type { Blob } from 'node:buffer';

import { getAcceptedImageFileMimeType } from '@/utils/file';

import { defaultApiErrors } from '../constants/api';

export async function validateImageFileMimeTypeAndSize(file: Blob, acceptGif?: boolean, ignoreFileSize?: boolean) {
    const fileMimeType = await getAcceptedImageFileMimeType(file, acceptGif);
    if (!fileMimeType) throw defaultApiErrors.notFound;
    if (!ignoreFileSize && file.size > 1048576 * 16) throw defaultApiErrors.payloadTooLarge; // Max 16MB
    return fileMimeType;
}
