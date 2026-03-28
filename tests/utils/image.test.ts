import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import sharp from 'sharp';
import {
    describe,
    it,
} from 'vitest';

import {
    autoConvertAnimatedImageToWebp,
    convertImage,
} from '../../src/utils/image';

const imageJpgPath = join(__dirname, 'image.jpg');
const imageGifPath = join(__dirname, 'image.gif');

// Tests
describe('autoConvertAnimatedImageToWebp', () => {
    it('should correctly convert JPG image specifying { buffer, type } to webp', async ({ expect }) => {
        const buffer = await readFile(imageJpgPath);
        const resultBuffer = await autoConvertAnimatedImageToWebp({
            buffer,
            type: 'image/jpeg',
        });

        expect(Buffer.isBuffer(resultBuffer)).toBe(true);
        const metadata = await sharp(resultBuffer).metadata();
        expect(metadata.format).toBe('webp');
    });

    it('should correctly convert JPG image File directly to webp', async ({ expect }) => {
        const buffer = await readFile(imageJpgPath);
        // Using Node's global File if available, otherwise just mock an object matching BinaryInput interface
        const input: any = typeof File !== 'undefined'
            ? new File([buffer], 'image.jpg', { type: 'image/jpeg' })
            : {
                buffer,
                type: 'image/jpeg',
            };

        const resultBuffer = await autoConvertAnimatedImageToWebp(input);

        expect(Buffer.isBuffer(resultBuffer)).toBe(true);
        const metadata = await sharp(resultBuffer).metadata();
        expect(metadata.format).toBe('webp');
    });

    it('should correctly process GIF animated type into animated webp', async ({ expect }) => {
        const buffer = await readFile(imageGifPath);

        const resultBuffer = await autoConvertAnimatedImageToWebp({
            buffer,
            type: 'image/gif',
        });

        expect(Buffer.isBuffer(resultBuffer)).toBe(true);
        const metadata = await sharp(resultBuffer).metadata();
        expect(metadata.format).toBe('webp');

        // Assert that the image retains its animated property (multiple pages/frames).
        expect(metadata.pages).toBeGreaterThan(1);
    });
});

describe('convertImage', () => {
    it('should successfully convert a JPG image buffer to webp by default', async ({ expect }) => {
        const buffer = await readFile(imageJpgPath);

        const resultBuffer = await convertImage(buffer);

        expect(Buffer.isBuffer(resultBuffer)).toBe(true);
        const metadata = await sharp(resultBuffer).metadata();
        expect(metadata.format).toBe('webp');
    });

    it('should successfully convert a JPG image buffer to specific requested format', async ({ expect }) => {
        const buffer = await readFile(imageJpgPath);

        const resultBuffer = await convertImage(buffer, undefined, 'png', { quality: 80 });

        expect(Buffer.isBuffer(resultBuffer)).toBe(true);
        const metadata = await sharp(resultBuffer).metadata();
        expect(metadata.format).toBe('png');
    });
});
