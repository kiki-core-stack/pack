import {
    Buffer,
    Blob as BufferBlob,
} from 'node:buffer';

import {
    beforeEach,
    describe,
    it,
    vi,
} from 'vitest';
import { z } from 'zod/v4';

import { customFile } from '../../../src/libs/zod/custom-file';
import { getFileMimeType as _getFileMimeType } from '../../../src/utils/file';

// Mock the getFileMimeType function
vi.mock('../../../src/utils/file', () => ({ getFileMimeType: vi.fn() }));
const getFileMimeType = vi.mocked(_getFileMimeType);

describe.concurrent('customFile', () => {
    beforeEach(() => vi.clearAllMocks());

    describe.concurrent('basic functionality', () => {
        it('should create a valid schema instance', ({ expect }) => {
            const schema = customFile();
            expect(schema).toBeDefined();
            expect(schema.def).toBeDefined();
        });

        it('should validate BufferBlob instances', async ({ expect }) => {
            const schema = customFile();
            const blob = new BufferBlob(['test']);

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should reject non-BufferBlob instances', async ({ expect }) => {
            const schema = customFile();
            const result = await schema.safeParseAsync('not a blob');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.message).toContain('Input not instance of Blob');
        });
    });

    describe.concurrent('mime type validation', () => {
        it('should accept allowed MIME types', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/jpeg');

            const schema = customFile().jpeg();
            const blob = new BufferBlob(['test'], { type: 'image/jpeg' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should reject disallowed MIME types', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/gif');

            const schema = customFile().jpeg().png();
            const blob = new BufferBlob(['test'], { type: 'image/gif' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.message).toContain('Invalid MIME type: image/gif');
            expect(result.error?.issues[0]?.message).toContain('Allowed types: image/jpeg, image/png');
        });

        it('should update blob type if detected type differs', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/png');

            const schema = customFile().png();
            const blob = new BufferBlob(['test'], { type: 'application/octet-stream' });

            const result = await schema.parseAsync(blob);
            expect(result.type).toBe('image/png');
        });

        it('should handle null MIME type detection', async ({ expect }) => {
            getFileMimeType.mockResolvedValue(null!);

            const schema = customFile().png();
            const blob = new BufferBlob(['test']);

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.message).toContain('Invalid MIME type: null.');
        });
    });

    describe.concurrent('specific format methods', () => {
        it('should validate PNG files', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/png');

            const schema = customFile().png();
            const blob = new BufferBlob(['test'], { type: 'image/png' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should validate JPEG files', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/jpeg');

            const schema = customFile().jpeg();
            const blob = new BufferBlob(['test'], { type: 'image/jpeg' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should validate GIF files', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/gif');

            const schema = customFile().gif();
            const blob = new BufferBlob(['test'], { type: 'image/gif' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should validate WebP files', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/webp');

            const schema = customFile().webp();
            const blob = new BufferBlob(['test'], { type: 'image/webp' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });
    });

    describe.concurrent('common images validation', () => {
        const commonImageTypes = [
            'image/bmp',
            'image/heic',
            'image/heif',
            'image/jpeg',
            'image/png',
            'image/tiff',
            'image/webp',
        ];

        commonImageTypes.forEach((mimeType) => {
            it(`should accept ${mimeType} with commonImages()`, async ({ expect }) => {
                getFileMimeType.mockResolvedValue(mimeType);

                const schema = customFile().commonImages();
                const blob = new BufferBlob(['test'], { type: mimeType });

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(true);
            });
        });

        it('should reject non-common image types', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/svg+xml');

            const schema = customFile().commonImages();
            const blob = new BufferBlob(['test'], { type: 'image/svg+xml' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(false);
        });
    });

    describe.concurrent('custom MIME types', () => {
        it('should accept custom MIME types as single string', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('application/pdf');

            const schema = customFile().mimeType('application/pdf');
            const blob = new BufferBlob(['test'], { type: 'application/pdf' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should accept custom MIME types as array', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('application/pdf');

            const schema = customFile().mimeType([
                'application/pdf',
                'application/msword',
            ]);

            const blob = new BufferBlob(['test'], { type: 'application/pdf' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should accept multiple custom MIME type calls', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('text/plain');

            const schema = customFile().mimeType('application/pdf').mimeType('text/plain');
            const blob = new BufferBlob(['test'], { type: 'text/plain' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should normalize MIME types to lowercase', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/jpeg');

            const schema = customFile().mimeType('IMAGE/JPEG');
            const blob = new BufferBlob(['test'], { type: 'image/jpeg' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });
    });

    describe.concurrent('file size validation', () => {
        describe.concurrent('maximum size validation', () => {
            it('should accept files within maxSize limit', async ({ expect }) => {
                const schema = customFile().maxSize(1000);
                const blob = new BufferBlob([Buffer.alloc(500)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(true);
            });

            it('should reject files exceeding maxSize limit', async ({ expect }) => {
                const schema = customFile().maxSize(100);
                const blob = new BufferBlob([Buffer.alloc(200)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(false);
            });

            it('should return correct error code when file exceeds maxSize', async ({ expect }) => {
                const schema = customFile().maxSize(100);
                const blob = new BufferBlob([Buffer.alloc(200)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(false);
                expect(result.error?.issues[0]?.code).toBe('custom');
            });

            it('should return correct error message when file exceeds maxSize', async ({ expect }) => {
                const schema = customFile().maxSize(100);
                const blob = new BufferBlob([Buffer.alloc(200)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(false);
                expect(result.error?.issues[0]?.message).toContain('File too large! Max 100 bytes allowed.');
            });

            it('should return correct error params when file exceeds maxSize', async ({ expect }) => {
                const schema = customFile().maxSize(100);
                const blob = new BufferBlob([Buffer.alloc(200)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(false);
                if (result.error?.issues[0]?.code === 'custom') {
                    expect(result.error.issues[0].params).toEqual({ reason: 'fileTooLarge' });
                }
            });

            it('should validate maxSizeKb correctly', async ({ expect }) => {
                const schema = customFile().maxSizeKb(1);
                const blob = new BufferBlob([Buffer.alloc(500)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(true);
            });

            it('should validate maxSizeMb correctly', async ({ expect }) => {
                const schema = customFile().maxSizeMb(1);
                const blob = new BufferBlob([Buffer.alloc(1000)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(true);
            });
        });

        describe.concurrent('minimum size validation', () => {
            it('should accept files meeting minSize requirement', async ({ expect }) => {
                const schema = customFile().minSize(100);
                const blob = new BufferBlob([Buffer.alloc(200)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(true);
            });

            it('should reject files below minSize requirement', async ({ expect }) => {
                const schema = customFile().minSize(1000);
                const blob = new BufferBlob([Buffer.alloc(500)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(false);
            });

            it('should return correct error code when file is below minSize', async ({ expect }) => {
                const schema = customFile().minSize(1000);
                const blob = new BufferBlob([Buffer.alloc(500)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(false);
                expect(result.error?.issues[0]?.code).toBe('custom');
            });

            it('should return correct error message when file is below minSize', async ({ expect }) => {
                const schema = customFile().minSize(1000);
                const blob = new BufferBlob([Buffer.alloc(500)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(false);
                expect(result.error?.issues[0]?.message).toContain('File too small! Min 1000 bytes allowed.');
            });

            it('should return correct error params when file is below minSize', async ({ expect }) => {
                const schema = customFile().minSize(1000);
                const blob = new BufferBlob([Buffer.alloc(500)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(false);
                if (result.error?.issues[0]?.code === 'custom') {
                    expect(result.error.issues[0].params).toEqual({ reason: 'fileTooSmall' });
                }
            });

            it('should validate minSizeKb correctly', async ({ expect }) => {
                const schema = customFile().minSizeKb(1);
                const blob = new BufferBlob([Buffer.alloc(2048)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(true);
            });

            it('should validate minSizeMb correctly', async ({ expect }) => {
                const schema = customFile().minSizeMb(0.001);
                const blob = new BufferBlob([Buffer.alloc(2048)]);

                const result = await schema.safeParseAsync(blob);
                expect(result.success).toBe(true);
            });
        });
    });

    describe.concurrent('method chaining', () => {
        it('should support chaining multiple methods', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/jpeg');

            const schema = customFile().jpeg().png().maxSizeMb(5).minSizeKb(10);
            const blob = new BufferBlob([Buffer.alloc(20 * 1024)], { type: 'image/jpeg' });

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should maintain chainability after transformations', async ({ expect }) => {
            getFileMimeType.mockResolvedValue('image/png');

            const schema = customFile().png().optional().nullable().default(null);

            expect(schema).toBeDefined();
            const result = await schema.parseAsync(undefined);
            expect(result).toBe(null);
        });
    });

    describe.concurrent('integration with Zod methods', () => {
        it('should work with optional()', async ({ expect }) => {
            const schema = customFile().optional();
            const result = await schema.safeParseAsync(undefined);

            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toBeUndefined();
        });

        it('should work with nullable()', async ({ expect }) => {
            const schema = customFile().nullable();
            const result = await schema.safeParseAsync(null);

            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toBeNull();
        });

        it('should work with array()', async ({ expect }) => {
            const schema = z.array(customFile());
            const blob1 = new BufferBlob(['test1']);
            const blob2 = new BufferBlob(['test2']);

            const result = await schema.safeParseAsync([
                blob1,
                blob2,
            ]);

            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toHaveLength(2);
        });
    });

    describe.concurrent('edge cases', () => {
        it('should handle empty blob', async ({ expect }) => {
            const schema = customFile();
            const blob = new BufferBlob([]);

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });

        it('should handle multiple size constraints', async ({ expect }) => {
            const schema = customFile().minSize(100).maxSize(1000);
            const blob = new BufferBlob([Buffer.alloc(500)]);

            const result = await schema.safeParseAsync(blob);
            expect(result.success).toBe(true);
        });
    });
});
