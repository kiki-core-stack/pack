import type { Blob } from 'node:buffer';

import { getAcceptedImageFileMimeType } from '@/utils/file';

export async function validateImageFileMimeTypeAndSize(file: Blob, acceptGif?: boolean, ignoreFileSize?: boolean) {
    const fileMimeType = await getAcceptedImageFileMimeType(file, acceptGif);
    if (!fileMimeType) throwApiError(400);
    if (!ignoreFileSize && file.size > 1048576 * 16) throwApiError(413); // Max 16MB
    return fileMimeType;
}
