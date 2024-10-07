import type { PathLike } from '@kikiutils/classes/path';
import { chmod, remove } from '@kikiutils/fs-extra';
import sharp from 'sharp';
import type { Sharp } from 'sharp';

export const convertAndSaveImageFile = async (file: Blob, savePath: PathLike, format: Parameters<Sharp['toFormat']>[0] = 'webp', options?: Parameters<Sharp['toFormat']>[1]) => {
	try {
		// prettier-ignore
		await sharp(await file.arrayBuffer()).toFormat(format, { quality: 75, ...options }).toFile(savePath.toString());
		if (await chmod(savePath.toString(), 0o755)) return true;
	} catch {}
	remove(savePath.toString());
	return false;
};
