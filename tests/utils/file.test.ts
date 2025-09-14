import {
    describe,
    it,
    vi,
} from 'vitest';

import { getFileMimeType } from '@/utils/file';

// Mocks
vi.mock('file-type', () => ({ fileTypeFromBuffer: vi.fn() }));

// Functions
async function getMockedFileTypeFromBuffer() {
    const { fileTypeFromBuffer } = await import('file-type');
    return vi.mocked(fileTypeFromBuffer);
}

// Tests
describe('getFileMimeType', () => {
    it('should return lowercase mime type if file is recognized', async ({ expect }) => {
        const fileTypeFromBuffer = await getMockedFileTypeFromBuffer();
        fileTypeFromBuffer.mockResolvedValue({
            ext: 'png',
            mime: 'image/png',
        });

        const result = await getFileMimeType(new Blob());
        expect(result).toBe('image/png');
    });

    it('should return undefined if file-type returns undefined', async ({ expect }) => {
        const fileTypeFromBuffer = await getMockedFileTypeFromBuffer();
        fileTypeFromBuffer.mockResolvedValue(undefined);

        const result = await getFileMimeType(new Blob());
        expect(result).toBeUndefined();
    });
});
