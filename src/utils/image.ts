import type { PathLike } from '@kikiutils/classes/path';
import {
    chmod,
    remove,
} from '@kikiutils/fs-extra';
import logger from '@kikiutils/node/consola';
import type { Blob } from 'node:buffer';
import sharp from 'sharp';
import type {
    Sharp,
    SharpOptions,
} from 'sharp';

export async function convertAndSaveImageFile(
    file: Blob,
    savePath: PathLike,
    inputOptions?: SharpOptions,
    outputFormat: Parameters<Sharp['toFormat']>[0] = 'webp',
    outputOptions?: Parameters<Sharp['toFormat']>[1],
) {
    try {
        await sharp(await file.arrayBuffer(), inputOptions)
            .toFormat(
                outputFormat,
                {
                    quality: 75,
                    ...outputOptions,
                },
            )
            .toFile(savePath.toString());

        if (await chmod(savePath.toString(), 0o644)) return true;
    } catch (error) {
        logger.error(error);
    }

    remove(savePath.toString());
    return false;
}
