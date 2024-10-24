import type { PathLike } from '@kikiutils/classes/path';
import type { Sharp, SharpOptions } from 'sharp';

import { isAcceptedImageFile } from '@/utils/file';
import { convertAndSaveImageFile } from '@/utils/image';

export const convertAndSaveImageFileOrThrowError = async (file: Blob, savePath: PathLike, inputOptions?: SharpOptions, outputFormat: Parameters<Sharp['toFormat']>[0] = 'webp', outputOptions?: Parameters<Sharp['toFormat']>[1]) => {
	if (!(await convertAndSaveImageFile(file, savePath, inputOptions, outputFormat, outputOptions))) throwAPIError(500);
};

export const validateImageFile = async (file: Blob, acceptGif?: boolean, ignoreFileSize?: boolean) => {
	if (!(await isAcceptedImageFile(file, acceptGif))) throwAPIError(400);
	if (!ignoreFileSize && file.size > 1048576 * 16) throwAPIError(413); // Max 16MB
};
