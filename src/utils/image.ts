import type { PathLike } from '@kikiutils/classes/path';
import { chmod, remove } from '@kikiutils/fs-extra';
import sharp from 'sharp';
import type { Sharp, SharpOptions } from 'sharp';

export const convertAndSaveImageFile = async (file: Blob, savePath: PathLike, inputOptions?: SharpOptions, outputFormat: Parameters<Sharp['toFormat']>[0] = 'webp', outputOptions?: Parameters<Sharp['toFormat']>[1]) => {
	try {
		// prettier-ignore
		await sharp(await file.arrayBuffer(), inputOptions).toFormat(outputFormat, { quality: 75, ...outputOptions }).toFile(savePath.toString());
		if (await chmod(savePath.toString(), 0o755)) return true;
	} catch {}
	remove(savePath.toString());
	return false;
};
