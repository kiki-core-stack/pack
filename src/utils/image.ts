import { Blob } from 'node:buffer';
import type { Buffer } from 'node:buffer';

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
