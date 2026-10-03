import { EnhancedDate } from '@kikiutils/shared/classes/enhanced-date';
import {
    describe,
    it,
} from 'vitest';

import * as z from '../../../src/libs/zod';

describe.concurrent('strict iso date string', () => {
    it('should accept canonical ISO date strings', ({ expect }) => {
        const value = '2026-05-15T05:00:00.000Z';

        const result = z.strictIsoDateString().safeParse(value);

        expect(result.success).toBe(true);
        expect(result.data).toBe(value);
    });

    it('should reject parseable but non-canonical date strings', ({ expect }) => {
        const result = z.strictIsoDateString().safeParse('2026-05-15');

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]).toMatchObject({
            code: 'invalid_format',
            format: 'iso8601',
            message: 'Invalid ISO 8601 date string',
        });
    });

    it.for([
        '2026-02-29T00:00:00.000Z',
        '2026-05-15T05:00:00Z',
        '2026-05-15T13:00:00.000+08:00',
    ])(
        'should reject non-canonical or normalized dates: %s',
        (value, { expect }) => expect(z.strictIsoDateString().safeParse(value).success).toBe(false),
    );

    it('should reject impossible date strings', ({ expect }) => {
        const result = z.strictIsoDateString().safeParse('not-a-date');

        expect(result.success).toBe(false);
    });
});

describe.concurrent('strict iso date', () => {
    it('should transform canonical ISO date strings to dates', ({ expect }) => {
        const value = '2026-05-15T05:00:00.000Z';

        const result = z.strictIsoDate().safeParse(value);

        expect(result.success).toBe(true);
        expect(result.data).toBeInstanceOf(Date);
        expect(result.data).toBeInstanceOf(EnhancedDate);
        expect(result.data?.toISOString()).toBe(value);
    });
});
