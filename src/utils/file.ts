import { toBuffer } from '@kikiutils/shared/buffer';
import type { BinaryInput } from '@kikiutils/shared/types';
import {
    fileTypeFromBlob,
    fileTypeFromBuffer,
} from 'file-type';

/**
 * Detects the MIME type from the file content (magic bytes), ignoring any declared type.
 *
 * Blobs are read only as far as needed, so large uploads are not loaded into memory.
 */
export async function getFileMimeType(input: BinaryInput) {
    const result = input instanceof Blob
        ? await fileTypeFromBlob(input)
        : await fileTypeFromBuffer(input instanceof ArrayBuffer ? input : await toBuffer(input));

    return result?.mime.toLowerCase();
}
