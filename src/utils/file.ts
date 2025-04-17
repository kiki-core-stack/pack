import type { Blob as BufferBlob } from 'node:buffer';

import { fileTypeFromBlob } from 'file-type';

export async function getFileMimeType(file: Blob | BufferBlob) {
    return (await fileTypeFromBlob(file as Blob))?.mime.toLowerCase();
}
