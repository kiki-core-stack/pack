import { toBuffer } from '@kikiutils/shared/buffer';
import type { BinaryInput } from '@kikiutils/shared/types';
import { fileTypeFromBuffer } from 'file-type';

export async function getFileMimeType(input: BinaryInput) {
    const buffer = input instanceof ArrayBuffer ? input : await toBuffer(input);
    const result = await fileTypeFromBuffer(buffer);
    return result?.mime.toLowerCase();
}
