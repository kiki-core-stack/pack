import { Buffer } from 'node:buffer';

import {
    beforeEach,
    describe,
    it,
    vi,
} from 'vitest';

import * as z from '@/libs/zod';

// Mocks
vi.mock('@/utils/file', () => ({ getFileMimeType: vi.fn() }));

// Functions
async function getMockedGetFileMimeType() {
    const { getFileMimeType } = await import('@/utils/file');
    return vi.mocked(getFileMimeType);
}

// Tests
describe('customFile', () => {
    beforeEach(() => vi.clearAllMocks());

    describe('basic functionality', () => {
        it('should create a valid schema instance', ({ expect }) => {
            const schema = z.customFile();
            expect(schema).toBeDefined();
            expect(schema.def).toBeDefined();
        });

        it('should validate Blob instances', async ({ expect }) => {
            const schema = z.customFile();

            const result = await schema.safeParseAsync(new Blob(['test']));
            expect(result.success).toBe(true);
        });

        it('should reject non-Blob instances', async ({ expect }) => {
            const schema = z.customFile();

            const result = await schema.safeParseAsync('not a blob');
            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.message).toContain('Invalid input: expected file, received string');
        });
    });

    describe('mime type validation', () => {
        it('should accept allowed MIME types', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/jpeg');

            const schema = z.customFile().jpeg();

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'image/jpeg' }));
            expect(result.success).toBe(true);
        });

        it('should reject disallowed MIME types', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/gif');

            const schema = z.customFile().jpeg().png();

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'image/gif' }));
            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.message).toContain(
                'Invalid MIME type: image/gif, allowed types: image/jpeg, image/png',
            );
        });

        it('should update blob type if detected type differs', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/png');

            const schema = z.customFile().png();

            const result = await schema.parseAsync(new Blob(['test'], { type: 'application/octet-stream' }));
            expect(result.type).toBe('image/png');
        });

        it('should handle null MIME type detection', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue(null!);

            const schema = z.customFile().png();

            const result = await schema.safeParseAsync(new Blob(['test']));
            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.message).toContain('Invalid MIME type: null, allowed types: image/png');
        });
    });

    describe('specific format methods', () => {
        it('should validate PNG files', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/png');

            const schema = z.customFile().png();

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'image/png' }));
            expect(result.success).toBe(true);
        });

        it('should validate JPEG files', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/jpeg');

            const schema = z.customFile().jpeg();

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'image/jpeg' }));
            expect(result.success).toBe(true);
        });

        it('should validate GIF files', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/gif');

            const schema = z.customFile().gif();

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'image/gif' }));
            expect(result.success).toBe(true);
        });

        it('should validate WebP files', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/webp');

            const schema = z.customFile().webp();

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'image/webp' }));
            expect(result.success).toBe(true);
        });
    });

    describe('common images validation', () => {
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
                const getFileMimeType = await getMockedGetFileMimeType();
                getFileMimeType.mockResolvedValue(mimeType);

                const schema = z.customFile().commonImages();

                const result = await schema.safeParseAsync(new Blob(['test'], { type: mimeType }));
                expect(result.success).toBe(true);
            });
        });

        it('should reject non-common image types', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/svg+xml');

            const schema = z.customFile().commonImages();

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'image/svg+xml' }));
            expect(result.success).toBe(false);
        });
    });

    describe('custom MIME types', () => {
        it('should accept custom MIME types as single string', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('application/pdf');

            const schema = z.customFile().mimeType('application/pdf');

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'application/pdf' }));
            expect(result.success).toBe(true);
        });

        it('should accept custom MIME types as array', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('application/pdf');

            const schema = z.customFile().mimeType([
                'application/pdf',
                'application/msword',
            ]);

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'application/pdf' }));
            expect(result.success).toBe(true);
        });

        it('should accept custom MIME types as multiple arguments', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('application/pdf');

            const schema = z.customFile().mimeType('application/pdf', 'application/msword');

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'application/pdf' }));
            expect(result.success).toBe(true);
        });

        it('should accept multiple custom MIME type calls', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('text/plain');

            const schema = z.customFile().mimeType('application/pdf').mimeType('text/plain');

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'text/plain' }));
            expect(result.success).toBe(true);
        });

        it('should normalize MIME types to lowercase', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/jpeg');

            const schema = z.customFile().mimeType('IMAGE/JPEG');

            const result = await schema.safeParseAsync(new Blob(['test'], { type: 'image/jpeg' }));
            expect(result.success).toBe(true);
        });
    });

    describe('file size validation', () => {
        describe.concurrent('maximum size validation', () => {
            it('should accept files within maxSize limit', async ({ expect }) => {
                const schema = z.customFile().maxSize(1000);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(500)]));
                expect(result.success).toBe(true);
            });

            it('should reject files exceeding maxSize limit', async ({ expect }) => {
                const schema = z.customFile().maxSize(100);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(200)]));
                expect(result.success).toBe(false);
            });

            it('should return correct error code when file exceeds maxSize', async ({ expect }) => {
                const schema = z.customFile().maxSize(100);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(200)]));
                expect(result.success).toBe(false);
                expect(result.error?.issues[0]?.code).toBe('custom');
            });

            it('should return correct error message when file exceeds maxSize', async ({ expect }) => {
                const schema = z.customFile().maxSize(100);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(200)]));
                expect(result.success).toBe(false);
                expect(result.error?.issues[0]?.message).toContain('File too large! Max 100 bytes allowed');
            });

            it('should return correct error params when file exceeds maxSize', async ({ expect }) => {
                const schema = z.customFile().maxSize(100);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(200)]));
                expect(result.success).toBe(false);
                if (result.error?.issues[0]?.code === 'custom') {
                    expect(result.error.issues[0].params).toEqual({ reason: 'fileTooLarge' });
                }
            });

            it('should validate maxSizeKb correctly', async ({ expect }) => {
                const schema = z.customFile().maxSizeKb(1);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(500)]));
                expect(result.success).toBe(true);
            });

            it('should validate maxSizeMb correctly', async ({ expect }) => {
                const schema = z.customFile().maxSizeMb(1);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(1000)]));
                expect(result.success).toBe(true);
            });
        });

        describe.concurrent('minimum size validation', () => {
            it('should accept files meeting minSize requirement', async ({ expect }) => {
                const schema = z.customFile().minSize(100);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(200)]));
                expect(result.success).toBe(true);
            });

            it('should reject files below minSize requirement', async ({ expect }) => {
                const schema = z.customFile().minSize(1000);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(500)]));
                expect(result.success).toBe(false);
            });

            it('should return correct error code when file is below minSize', async ({ expect }) => {
                const schema = z.customFile().minSize(1000);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(500)]));
                expect(result.success).toBe(false);
                expect(result.error?.issues[0]?.code).toBe('custom');
            });

            it('should return correct error message when file is below minSize', async ({ expect }) => {
                const schema = z.customFile().minSize(1000);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(500)]));
                expect(result.success).toBe(false);
                expect(result.error?.issues[0]?.message).toContain('File too small! Min 1000 bytes allowed');
            });

            it('should return correct error params when file is below minSize', async ({ expect }) => {
                const schema = z.customFile().minSize(1000);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(500)]));
                expect(result.success).toBe(false);
                if (result.error?.issues[0]?.code === 'custom') {
                    expect(result.error.issues[0].params).toEqual({ reason: 'fileTooSmall' });
                }
            });

            it('should validate minSizeKb correctly', async ({ expect }) => {
                const schema = z.customFile().minSizeKb(1);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(2048)]));
                expect(result.success).toBe(true);
            });

            it('should validate minSizeMb correctly', async ({ expect }) => {
                const schema = z.customFile().minSizeMb(0.001);

                const result = await schema.safeParseAsync(new Blob([Buffer.alloc(2048)]));
                expect(result.success).toBe(true);
            });
        });
    });

    describe('method chaining', () => {
        it('should support chaining multiple methods', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/jpeg');

            const schema = z.customFile().jpeg().png().maxSizeMb(5).minSizeKb(10);

            const result = await schema.safeParseAsync(new Blob([Buffer.alloc(20 * 1024)], { type: 'image/jpeg' }));
            expect(result.success).toBe(true);
        });

        it('should maintain chainability after transformations', async ({ expect }) => {
            const getFileMimeType = await getMockedGetFileMimeType();
            getFileMimeType.mockResolvedValue('image/png');

            const schema = z.customFile().png().optional().nullable().default(null);

            const result = await schema.parseAsync(undefined);
            expect(result).toBe(null);
        });
    });

    describe('integration with Zod methods', () => {
        it('should work with optional()', async ({ expect }) => {
            const schema = z.customFile().optional();

            const result = await schema.safeParseAsync(undefined);
            expect(result.success).toBe(true);
            expect(result.data).toBeUndefined();
        });

        it('should work with nullable()', async ({ expect }) => {
            const schema = z.customFile().nullable();

            const result = await schema.safeParseAsync(null);
            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
        });

        it('should work with array()', async ({ expect }) => {
            const schema = z.array(z.customFile());
            const blob1 = new Blob(['test1']);
            const blob2 = new Blob(['test2']);

            const result = await schema.safeParseAsync([
                blob1,
                blob2,
            ]);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });
    });

    describe('edge cases', () => {
        it('should handle empty blob', async ({ expect }) => {
            const schema = z.customFile();

            const result = await schema.safeParseAsync(new Blob([]));
            expect(result.success).toBe(true);
        });

        it('should handle multiple size constraints', async ({ expect }) => {
            const schema = z.customFile().minSize(100).maxSize(1000);

            const result = await schema.safeParseAsync(new Blob([Buffer.alloc(500)]));
            expect(result.success).toBe(true);
        });
    });
});
