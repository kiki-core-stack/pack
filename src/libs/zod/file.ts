import { Blob } from 'node:buffer';

import * as z from 'zod';
import type {
    ZodEffects,
    ZodType,
    ZodTypeDef,
} from 'zod';

import { getFileMimeType } from '@/utils/file';

interface ZodFile extends ZodEffects<ZodEffects<ZodType<Blob, ZodTypeDef, Blob>, Blob, Blob>, Blob, Blob> {
    commonImages: () => ZodFile;
    gif: () => ZodFile;
    jpeg: () => ZodFile;
    maxSize: (bytes: number) => ZodFile;
    maxSizeKb: (kb: number) => ZodFile;
    maxSizeMb: (mb: number) => ZodFile;
    mimeType: (mimeType: string) => ZodFile;
    mimeTypes: (mimeTypes: string[]) => ZodFile;
    png: () => ZodFile;
    webp: () => ZodFile;
}

const commonImageMimeTypes: readonly string[] = [
    'image/bmp',
    'image/jpeg',
    'image/heic',
    'image/heif',
    'image/png',
    'image/tiff',
    'image/webp',
];

export function file() {
    const allowedMimeTypes = new Set<string>();
    let detectedMimeType: string | undefined;
    let maxBytes: number | undefined;
    const zodFile = z
        .instanceof(Blob)
        .superRefine(async (file, ctx) => {
            detectedMimeType = await getFileMimeType(file);
            if (!detectedMimeType || !allowedMimeTypes.has(detectedMimeType)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Invalid MIME type: ${detectedMimeType}.`,
                });
            }

            if (maxBytes !== undefined && file.size > maxBytes) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `File size must be less than ${maxBytes} bytes.`,
                    params: { reason: 'file_too_large' },
                });
            }
        })
        .transform((file) => {
            if (file.type === detectedMimeType) return file;
            return new Blob([file], { type: detectedMimeType });
        });

    Object.assign(
        zodFile,
        {
            commonImages() {
                commonImageMimeTypes.forEach((mimeType) => allowedMimeTypes.add(mimeType));
                return zodFile;
            },
            gif() {
                allowedMimeTypes.add('image/gif');
                return zodFile;
            },
            jpeg() {
                allowedMimeTypes.add('image/jpeg');
                return zodFile;
            },
            maxSize(bytes: number) {
                maxBytes = bytes;
                return zodFile;
            },
            maxSizeKb(kb: number) {
                maxBytes = kb * 1024;
                return zodFile;
            },
            maxSizeMb(mb: number) {
                maxBytes = mb * 1024 * 1024;
                return zodFile;
            },
            mimeType(mimeType: string) {
                allowedMimeTypes.add(mimeType.toLowerCase());
                return zodFile;
            },
            mimeTypes(mimeTypes: string[]) {
                mimeTypes.forEach((mimeType) => allowedMimeTypes.add(mimeType.toLowerCase()));
                return zodFile;
            },
            png() {
                allowedMimeTypes.add('image/png');
                return zodFile;
            },
            webp() {
                allowedMimeTypes.add('image/webp');
                return zodFile;
            },
        },
    );

    return zodFile as ZodFile;
}
