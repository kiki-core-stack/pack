import { Blob as BufferBlob } from 'node:buffer';

import * as z from 'zod/v4';
import { ZodType } from 'zod/v4';
import type { ZodCustom } from 'zod/v4';
import type { ParsePayload } from 'zod/v4/core';

import { getFileMimeType } from '../../utils/file';

interface ZodCustomFile extends ZodCustom<BufferBlob, BufferBlob> {
    commonImages: () => this;
    gif: () => this;
    jpeg: () => this;
    maxSize: (bytes: number) => this;
    maxSizeKb: (kb: number) => this;
    maxSizeMb: (mb: number) => this;
    mimeType: (...mimeTypes: Readonlyable<Arrayable<string>>[]) => this;
    minSize: (bytes: number) => this;
    minSizeKb: (kb: number) => this;
    minSizeMb: (mb: number) => this;
    png: () => this;
    webp: () => this;
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
    const zodCustomFile = z
        .instanceof(BufferBlob)
        .check(async (ctx) => {
            if (!allowedMimeTypes.size) return;
            const detectedMimeType = await getFileMimeType(ctx.value);
            if (!detectedMimeType || !allowedMimeTypes.has(detectedMimeType)) {
                ctx.issues.push({
                    code: 'custom',
                    input: ctx.value,
                    // eslint-disable-next-line style/max-len
                    message: `Invalid MIME type: ${detectedMimeType}. Allowed types: ${[...allowedMimeTypes].join(', ')}.`,
                });
            }

            if (ctx.value.type !== detectedMimeType) {
                ctx.value = new BufferBlob([ctx.value], { type: detectedMimeType });
            }
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

        function maxSize(bytes: number) {
            return (ctx: ParsePayload<BufferBlob>) => {
                if (ctx.value.size > bytes) {
                    ctx.issues.push({
                        code: 'custom',
                        input: ctx.value,
                        message: `File too large! Max ${bytes} bytes allowed.`,
                        params: { reason: 'fileTooLarge' },
                    });
                }
            };
        }

        function mimeType(...mimeTypes: Readonlyable<Arrayable<string>>[]) {
            [mimeTypes].flat(2).forEach((mimeType) => allowedMimeTypes.add(mimeType.toLowerCase()));
            return proxy;
        }

        function minSize(bytes: number) {
            return (ctx: ParsePayload<BufferBlob>) => {
                if (ctx.value.size < bytes) {
                    ctx.issues.push({
                        code: 'custom',
                        input: ctx.value,
                        message: `File too small! Min ${bytes} bytes allowed.`,
                        params: { reason: 'fileTooSmall' },
                    });
                }
            };
        }

        const customMethods = {
            commonImages: () => mimeType(commonImageMimeTypes),
            gif: () => mimeType('image/gif'),
            jpeg: () => mimeType('image/jpeg'),
            maxSize: (bytes: number) => proxy.check(maxSize(bytes)),
            maxSizeKb: (kb: number) => proxy.check(maxSize(kb * 1024)),
            maxSizeMb: (mb: number) => proxy.check(maxSize(mb * 1024 * 1024)),
            mimeType,
            minSize: (bytes: number) => proxy.check(minSize(bytes)),
            minSizeKb: (kb: number) => proxy.check(minSize(kb * 1024)),
            minSizeMb: (mb: number) => proxy.check(minSize(mb * 1024 * 1024)),
            png: () => mimeType('image/png'),
            webp: () => mimeType('image/webp'),
        };

        return proxy as ZodCustomFile;
    }

    return decorate(zodCustomFile);
}
