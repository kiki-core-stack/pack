import { fileTypeFromBlob as _fileTypeFromBlob } from 'file-type';
import {
    describe,
    it,
    vi,
} from 'vitest';

import { getFileMimeType } from '../../src/utils/file';

vi.mock('file-type', () => ({ fileTypeFromBlob: vi.fn() }));
const fileTypeFromBlob = vi.mocked(_fileTypeFromBlob);

describe.concurrent('getFileMimeType', () => {
    it('should return lowercase mime type if file is recognized', async ({ expect }) => {
        fileTypeFromBlob.mockResolvedValue({
            ext: 'png',
            mime: 'image/png',
        });

        const result = await getFileMimeType(new Blob());
        expect(result).toBe('image/png');
    });

    it('should return undefined if file-type returns undefined', async ({ expect }) => {
        fileTypeFromBlob.mockResolvedValue(undefined);
        const result = await getFileMimeType(new Blob());
        expect(result).toBeUndefined();
    });
});
