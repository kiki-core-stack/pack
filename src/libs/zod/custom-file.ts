import * as z from 'zod';

import { getFileMimeType } from '../../utils/file';

type CustomFileSchema = ReturnType<typeof createSchema>;

interface CustomFileOptions {
    maxSize?: number;
    mimeTypes: readonly string[];
    minSize?: number;
}

export interface ZodCustomFile extends CustomFileSchema {
    commonImages: () => ZodCustomFile;
    getMaxSize: () => number | undefined;
    getMaxSizeKb: () => number | undefined;
    getMaxSizeMb: () => number | undefined;
    getMinSize: () => number | undefined;
    getMinSizeKb: () => number | undefined;
    getMinSizeMb: () => number | undefined;
    gif: () => ZodCustomFile;
    jpeg: () => ZodCustomFile;

    /**
     * Max size in bytes.
     */
    maxSize: (bytes: number) => ZodCustomFile;
    maxSizeKb: (kb: number) => ZodCustomFile;
    maxSizeMb: (mb: number) => ZodCustomFile;

    /**
     * Allowed MIME types, matched against the type detected from the file content.
     */
    mimeType: (...mimeTypes: Array<readonly string[] | string>) => ZodCustomFile;

    /**
     * Min size in bytes.
     */
    minSize: (bytes: number) => ZodCustomFile;
    minSizeKb: (kb: number) => ZodCustomFile;
    minSizeMb: (mb: number) => ZodCustomFile;
    png: () => ZodCustomFile;
    webp: () => ZodCustomFile;
}

export const commonImageMimeTypes: readonly string[] = [
    'image/bmp',
    'image/heic',
    'image/heif',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/webp',
];

// Functions
function createCustomFile(options: CustomFileOptions): ZodCustomFile {
    const divide = (bytes: number | undefined, divisor: number) => bytes === undefined ? undefined : bytes / divisor;
    const withOptions = (newOptions: Partial<CustomFileOptions>) => createCustomFile({
        ...options,
        ...newOptions,
    });

    const mimeType = (...mimeTypes: Array<readonly string[] | string>) => withOptions({
        mimeTypes: [
            ...new Set([
                ...options.mimeTypes,
                ...mimeTypes.flat().map((value) => value.toLowerCase()),
            ]),
        ],
    });

    return Object.assign(
        createSchema(options),
        {
            commonImages: () => mimeType(commonImageMimeTypes),
            getMaxSize: () => options.maxSize,
            getMaxSizeKb: () => divide(options.maxSize, 1024),
            getMaxSizeMb: () => divide(options.maxSize, 1024 * 1024),
            getMinSize: () => options.minSize,
            getMinSizeKb: () => divide(options.minSize, 1024),
            getMinSizeMb: () => divide(options.minSize, 1024 * 1024),
            gif: () => mimeType('image/gif'),
            jpeg: () => mimeType('image/jpeg'),
            maxSize: (bytes: number) => withOptions({ maxSize: bytes }),
            maxSizeKb: (kb: number) => withOptions({ maxSize: kb * 1024 }),
            maxSizeMb: (mb: number) => withOptions({ maxSize: mb * 1024 * 1024 }),
            mimeType,
            minSize: (bytes: number) => withOptions({ minSize: bytes }),
            minSizeKb: (kb: number) => withOptions({ minSize: kb * 1024 }),
            minSizeMb: (mb: number) => withOptions({ minSize: mb * 1024 * 1024 }),
            png: () => mimeType('image/png'),
            webp: () => mimeType('image/webp'),
        },
    );
}

function createSchema(options: CustomFileOptions) {
    let schema = z.file();
    if (options.minSize !== undefined) schema = schema.min(options.minSize);
    if (options.maxSize !== undefined) schema = schema.max(options.maxSize);
    if (options.mimeTypes.length) schema = schema.mime([...options.mimeTypes]);
    return z.preprocess(
        async (value) => {
            if (!(value instanceof Blob)) return value;
            const detectedMimeType = await getFileMimeType(value) ?? '';
            const file = value instanceof File ? value : undefined;
            if (file?.type === detectedMimeType) return file;
            return new File(
                [value],
                file?.name ?? '',
                {
                    lastModified: file?.lastModified,
                    type: detectedMimeType,
                },
            );
        },
        schema,
    );
}

/**
 * File schema accepting `File` or `Blob`, whose `type` is replaced by the MIME type detected from the file content
 * (empty when unknown), so MIME rules cannot be bypassed by a forged `Content-Type`.
 *
 * Every chained call returns a new schema. Size and MIME rules use Zod's native file checks, so they keep Zod's issue
 * codes and appear in JSON Schema. Call Zod methods such as `.optional()` last; they return plain Zod schemas.
 *
 * @example
 * ```ts
 * z.customFile().png().jpeg().maxSizeMb(5)
 * ```
 */
export const customFile = () => createCustomFile({ mimeTypes: [] });
