import {
    describe,
    it,
} from 'vitest';

import * as z from '../../../src/libs/zod';

enum TestStatus {
    Disabled = 0,
    Enabled = 1,
}

describe.concurrent('enum with meta', () => {
    it('should parse enum values and numeric strings of numeric values', ({ expect }) => {
        const schema = z.enumWithMeta('TestStatusParse', TestStatus);

        expect(schema.safeParse(TestStatus.Enabled).data).toBe(TestStatus.Enabled);
        expect(schema.safeParse('0').data).toBe(TestStatus.Disabled);
        expect(schema.safeParse(99).success).toBe(false);
        expect(schema.safeParse('99').success).toBe(false);
        expect(schema.safeParse('').success).toBe(false);
    });

    it('should document each value as a shared component', ({ expect }) => {
        const schema = z.enumWithMeta(
            'TestStatusDocs',
            TestStatus,
            { [TestStatus.Enabled]: '啟用' },
        );

        expect(z.toJSONSchema(z.object({ status: schema.describe('status') }), { io: 'input' })).toMatchObject({
            $defs: {
                TestStatusDocs: {
                    'enum': [
                        0,
                        1,
                    ],
                    'x-enum-descriptions': [
                        'Disabled',
                        '啟用',
                    ],
                    'x-enum-varnames': [
                        'Disabled',
                        'Enabled',
                    ],
                },
            },
            properties: {
                status: {
                    $ref: '#/$defs/TestStatusDocs',
                    description: 'status',
                },
            },
        });
    });
});
