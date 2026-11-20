import type { AutoConvertAnimatedImageToWebpInput } from '../utils/image';
import { autoConvertAnimatedImageToWebp } from '../utils/image';

import { uploadFileAndCreateDocument } from './file';

export async function uploadImageAndCreateFileDocument(input: AutoConvertAnimatedImageToWebpInput) {
    return await uploadFileAndCreateDocument(await autoConvertAnimatedImageToWebp(input));
}
