import type { Buffer } from 'node:buffer';

import { toBuffer } from '@kikiutils/shared/buffer';
import type { BinaryInput } from '@kikiutils/shared/types';
import sharp from 'sharp';
import type sharpTypes from 'sharp';

// Constants
const animatedMimeTypes = new Set([
    'image/gif',
    'image/webp',
]);

// Functions
export function autoConvertAnimatedImageToWebp(
    input: Exclude<BinaryInput, ArrayBuffer | Buffer | Uint8Array> | { buffer: BinaryInput; type: string },
    inputOptions?: sharpTypes.SharpOptions,
    outputOptions?: sharpTypes.WebpOptions,
) {
    inputOptions = {
        animated: animatedMimeTypes.has(input.type.toLowerCase()),
        ...inputOptions,
    };

    outputOptions = {
        alphaQuality: 85,
        ...outputOptions,
    };

    return convertImage('buffer' in input ? input.buffer : input, inputOptions, 'webp', outputOptions);
}

export async function convertImage(
    input: BinaryInput,
    inputOptions?: sharpTypes.SharpOptions,
    outputFormat: Parameters<sharpTypes.Sharp['toFormat']>[0] = 'webp',
    outputOptions?: Parameters<sharpTypes.Sharp['toFormat']>[1],
) {
    return await sharp(await toBuffer(input), inputOptions)
        .toFormat(
            outputFormat,
            {
                quality: 75,
                ...outputOptions,
            },
        )
        .toBuffer();
}
