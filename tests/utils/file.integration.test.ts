import { readFile } from 'node:fs/promises';

import { Path } from '@kikiutils/shared/classes/path';
import {
    describe,
    it,
} from 'vitest';

import { getFileMimeType } from '../../src/utils/file';

const imageJpgPath = Path.resolve(__dirname, 'image.jpg');

describe.concurrent('get file mime type integration', () => {
    it('should detect a real JPEG buffer without mocks', async ({ expect }) => {
        const buffer = await readFile(imageJpgPath.toString());

        await expect(getFileMimeType(buffer)).resolves.toBe('image/jpeg');
    });

    it('should return undefined for unknown binary content without mocks', async ({ expect }) => {
        await expect(getFileMimeType(new ArrayBuffer(8))).resolves.toBeUndefined();
    });
});
