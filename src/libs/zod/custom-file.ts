import { Blob } from 'node:buffer';

import * as z from 'zod/v4';
import { ZodType } from 'zod/v4';
import type {
    ZodCustom,
    ZodPipe,
    ZodTransform,
} from 'zod/v4';

import { getFileMimeType } from '../../utils/file';

interface ZodCustomFile extends ZodPipe<ZodCustom<Blob, Blob>, ZodTransform<Blob, Blob>> {
    commonImages: () => ZodCustomFile;
    gif: () => ZodCustomFile;
    jpeg: () => ZodCustomFile;
    maxSize: (bytes: number) => ZodCustomFile;
    maxSizeKb: (kb: number) => ZodCustomFile;
    maxSizeMb: (mb: number) => ZodCustomFile;
    mimeType: (mimeType: string) => ZodCustomFile;
    mimeTypes: (mimeTypes: string[]) => ZodCustomFile;
    png: () => ZodCustomFile;
    webp: () => ZodCustomFile;
}

const commonImageMimeTypes: readonly string[] = [
    'image/bmp',
    'image/heic',
    'image/heif',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/webp',
];

export function customFile() {
    const allowedMimeTypes = new Set<string>();
    let detectedMimeType: string | undefined;
    let maxBytes: number | undefined;
    const zodCustomFile = z
        .instanceof(Blob)
        .check(async (ctx) => {
            detectedMimeType = await getFileMimeType(ctx.value);
            if (!detectedMimeType || !allowedMimeTypes.has(detectedMimeType)) {
                ctx.issues.push({
                    code: 'custom',
                    input: ctx.value,
                    message: `Invalid MIME type: ${detectedMimeType}.`,
                });
            }

            if (maxBytes !== undefined && ctx.value.size > maxBytes) {
                ctx.issues.push({
                    code: 'custom',
                    input: ctx.value,
                    message: `File size must be less than ${maxBytes} bytes.`,
                    params: { reason: 'fileTooLarge' },
                });
            }
        })
        .transform((file) => {
            if (file.type === detectedMimeType) return file;
            return new Blob([file], { type: detectedMimeType });
        });

    function decorate(schema: any): ZodCustomFile {
        const clonedSchema = Object.create(Object.getPrototypeOf(schema));
        const descriptors = Object.getOwnPropertyDescriptors(schema);
        for (const [key, descriptor] of Object.entries(descriptors)) {
            Object.defineProperty(
                clonedSchema,
                key,
                {
                    ...descriptor,
                    configurable: true,
                },
            );
        }

        const proxy = new Proxy(
            clonedSchema,
            {
                get(target, prop, receiver) {
                    // eslint-disable-next-line ts/no-use-before-define
                    if (prop in customMethods) return customMethods[prop as keyof typeof customMethods];
                    const originalProperty = Reflect.get(target, prop, receiver);
                    if (typeof originalProperty === 'function') {
                        return (...args: any[]) => {
                            const result = originalProperty.apply(schema, args);
                            if (result instanceof ZodType) return decorate(result);
                            return result;
                        };
                    }

                    return originalProperty;
                },
            },
        );

        const customMethods = {
            commonImages() {
                commonImageMimeTypes.forEach((mimeType) => allowedMimeTypes.add(mimeType));
                return proxy;
            },
            gif() {
                allowedMimeTypes.add('image/gif');
                return proxy;
            },
            jpeg() {
                allowedMimeTypes.add('image/jpeg');
                return proxy;
            },
            maxSize(bytes: number) {
                maxBytes = bytes;
                return proxy;
            },
            maxSizeKb(kb: number) {
                maxBytes = kb * 1024;
                return proxy;
            },
            maxSizeMb(mb: number) {
                maxBytes = mb * 1024 * 1024;
                return proxy;
            },
            mimeType(mimeType: string) {
                allowedMimeTypes.add(mimeType.toLowerCase());
                return proxy;
            },
            mimeTypes(mimeTypes: string[]) {
                mimeTypes.forEach((mimeType) => allowedMimeTypes.add(mimeType.toLowerCase()));
                return proxy;
            },
            png() {
                allowedMimeTypes.add('image/png');
                return proxy;
            },
            webp() {
                allowedMimeTypes.add('image/webp');
                return proxy;
            },
        };

        return proxy as ZodCustomFile;
    }

    return decorate(zodCustomFile);
}
