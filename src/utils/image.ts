import { Blob } from 'node:buffer';
import type { Buffer } from 'node:buffer';

import { Path } from '@kikiutils/classes/path';
import type { PathLike } from '@kikiutils/classes/path';
// @ts-expect-error Ignore this error.
import sharp from 'sharp';
import type {
    Sharp,
    SharpInput,
    SharpOptions,
} from 'sharp';

declare function sharp(options?: SharpOptions): Sharp;
declare function sharp(input?: SharpInput | SharpInput[], options?: SharpOptions): Sharp;

export async function convertImage(
    input: Blob | Buffer,
    inputOptions?: SharpOptions,
    outputFormat: Parameters<Sharp['toFormat']>[0] = 'webp',
    outputOptions?: Parameters<Sharp['toFormat']>[1],
) {
    try {
        return await sharp(input instanceof Blob ? await input.arrayBuffer() : input, inputOptions)
            .toFormat(
                outputFormat,
                {
                    quality: 75,
                    ...outputOptions,
                },
            )
            .toBuffer();
    } catch {}
}

export async function saveConvertedImage(
    input: Blob | Buffer,
    savePath: PathLike,
    inputOptions?: SharpOptions,
    outputFormat: Parameters<Sharp['toFormat']>[0] = 'webp',
    outputOptions?: Parameters<Sharp['toFormat']>[1],
) {
    try {
        savePath = Path.resolve(savePath);
        const buffer = await convertImage(input, inputOptions, outputFormat, outputOptions);
        if (buffer && await savePath.writeFile(buffer) && await savePath.chmod(0o644)) return true;
        savePath.remove();
    } catch {}
    return false;
}
