import { toBuffer } from '@kikiutils/shared/buffer';
import { fileTypeFromBuffer } from 'file-type';

export async function getFileMimeType(input: BinaryInput) {
    return (await fileTypeFromBuffer(await toBuffer(input)))?.mime.toLowerCase();
}
