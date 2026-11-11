import { Buffer } from 'node:buffer';

import {
    describe,
    it,
} from 'vitest';

import * as z from '../../../src/libs/zod';

// Constants
// Minimal PNG header, enough for MIME detection.
const pngBytes = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');

// Tests
describe.concurrent('customFile', () => {
    it('should replace the declared type with the detected one', async ({ expect }) => {
        const result = await z.customFile().safeParseAsync(new File([pngBytes], 'a.jpg', { type: 'image/jpeg' }));

        expect(result.success).toBe(true);
        expect(result.data?.type).toBe('image/png');
        expect(result.data?.name).toBe('a.jpg');
    });

    it('should check MIME types against the detected type', async ({ expect }) => {
        const schema = z.customFile().mimeType('IMAGE/PNG');

        expect((await schema.safeParseAsync(new File([pngBytes], 'a.jpg', { type: 'image/jpeg' }))).success).toBe(true);
        const forged = await schema.safeParseAsync(new File(['hello'], 'a.png', { type: 'image/png' }));
        expect(forged.success).toBe(false);
        expect(forged.error?.issues[0]?.code).toBe('invalid_value');
    });

    it('should check size limits', async ({ expect }) => {
        const tooBig = await z.customFile().maxSize(10).safeParseAsync(new File([pngBytes], 'a.png'));
        const tooSmall = await z.customFile().minSize(100).safeParseAsync(new File([pngBytes], 'a.png'));

        expect(tooBig.error?.issues[0]?.code).toBe('too_big');
        expect(tooSmall.error?.issues[0]?.code).toBe('too_small');
    });

    it('should keep chained schemas independent', async ({ expect }) => {
        const png = z.customFile().png();
        const pngOrGif = png.gif();
        const file = new File([pngBytes], 'a.png');

        expect((await png.maxSize(10).safeParseAsync(file)).success).toBe(false);
        expect((await png.safeParseAsync(file)).success).toBe(true);
        expect((await pngOrGif.safeParseAsync(file)).success).toBe(true);
    });

    it('should accept Blob input and expose size limits', async ({ expect }) => {
        const schema = z.customFile().png().maxSizeKb(1);
        const result = await schema.safeParseAsync(new Blob([pngBytes]));

        expect(result.data).toBeInstanceOf(File);
        expect(result.data?.type).toBe('image/png');
        expect(schema.getMaxSize()).toBe(1024);
        expect(schema.getMaxSizeKb()).toBe(1);
        expect(schema.getMinSize()).toBeUndefined();
    });

    it('should reject non-file input', async ({ expect }) => {
        const result = await z.customFile().safeParseAsync('not a file');

        expect(result.error?.issues[0]?.code).toBe('invalid_type');
    });

    it('should keep rules in JSON Schema', ({ expect }) => {
        const schema = z.customFile().png().maxSize(1000);

        expect(z.toJSONSchema(schema, { io: 'input' })).toMatchObject({
            contentMediaType: 'image/png',
            format: 'binary',
            maxLength: 1000,
            type: 'string',
        });
    });
});
