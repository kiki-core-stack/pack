import type { Buffer } from 'node:buffer';

import { toBuffer } from '@kikiutils/shared/buffer';
import type { BinaryInput } from '@kikiutils/shared/types';
import sharp from 'sharp';
import type {
    FormatEnum,
    ResizeOptions,
    Sharp,
    SharpOptions,
    WebpOptions,
} from 'sharp';

export interface AutoConvertAnimatedImageToWebpInput {
    /**
     * A `File`/`Blob`, or a buffer with its MIME type; the type decides whether to keep the animation.
     */
    image: Exclude<BinaryInput, ArrayBuffer | Buffer | Uint8Array> | { buffer: BinaryInput; type: string };
    inputOptions?: SharpOptions;
    outputOptions?: WebpOptions;
    resizeOptions?: ResizeOptions;
}

export interface ConvertImageInput<F extends keyof FormatEnum = 'webp'> {
    /**
     * Defaults to `webp`.
     */
    format?: F;
    image: BinaryInput;
    inputOptions?: SharpOptions;
    outputOptions?: Parameters<Sharp['toFormat']>[1];
    resizeOptions?: ResizeOptions;
}

// Constants/Variables
const animatedMimeTypes = new Set([
    'image/gif',
    'image/webp',
]);

// Functions
export async function autoConvertAnimatedImageToWebp(input: AutoConvertAnimatedImageToWebpInput) {
    return await convertImage({
        image: 'buffer' in input.image ? input.image.buffer : input.image,
        inputOptions: {
            animated: animatedMimeTypes.has(input.image.type.toLowerCase()),
            ...input.inputOptions,
        },
        outputOptions: {
            alphaQuality: 85,
            ...input.outputOptions,
        },
        resizeOptions: input.resizeOptions,
    });
}

/**
 * Applies the EXIF orientation by default; output quality defaults to 75.
 */
export async function convertImage<F extends keyof FormatEnum = 'webp'>(input: ConvertImageInput<F>) {
    const image = sharp(
        await toBuffer(input.image),
        {
            autoOrient: true,
            ...input.inputOptions,
        },
    );

    if (input.resizeOptions) image.resize(input.resizeOptions);
    return await image
        .toFormat(
            input.format ?? 'webp',
            {
                quality: 75,
                ...input.outputOptions,
            },
        )
        .toBuffer();
}
