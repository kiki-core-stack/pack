import { Types } from 'mongoose';
import {
    describe,
    it,
} from 'vitest';

import * as z from '../../../src/libs/zod';

describe.concurrent('object id', () => {
    it('should transform valid object id strings to ObjectId instances', ({ expect }) => {
        const objectId = new Types.ObjectId();

        const result = z.objectId().safeParse(objectId.toHexString());

        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Types.ObjectId);
        expect(result.data?.toHexString()).toBe(objectId.toHexString());
    });

    it('should reject invalid object id strings', ({ expect }) => {
        const result = z.objectId().safeParse('invalid');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]).toMatchObject({
            code: 'invalid_format',
            format: 'objectid',
            message: 'Invalid ObjectId',
        });
    });
});

describe.concurrent('object id or empty string', () => {
    it('should keep empty strings as empty strings', ({ expect }) => {
        const result = z.objectIdOrEmptyString().safeParse('');

        expect(result.success).toBe(true);
        expect(result.data).toBe('');
    });

    it('should transform valid object id strings to ObjectId instances', ({ expect }) => {
        const objectId = new Types.ObjectId();

        const result = z.objectIdOrEmptyString().safeParse(objectId.toHexString());

        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Types.ObjectId);
        if (result.data instanceof Types.ObjectId) expect(result.data.toHexString()).toBe(objectId.toHexString());
    });

    it('should reject invalid non-empty strings', ({ expect }) => {
        const result = z.objectIdOrEmptyString().safeParse('invalid');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]).toMatchObject({
            code: 'invalid_format',
            format: 'objectid',
            message: 'Invalid ObjectId or empty string',
        });
    });
});
