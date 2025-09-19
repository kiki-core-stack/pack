import { toBuffer } from '@kikiutils/shared/buffer';
import type { BinaryInput } from '@kikiutils/types';
import { fileTypeFromBuffer } from 'file-type';

export async function getFileMimeType(input: BinaryInput) {
    const buffer = await toBuffer(input);
    const result = await fileTypeFromBuffer(buffer);
    return result?.mime.toLowerCase();
}
