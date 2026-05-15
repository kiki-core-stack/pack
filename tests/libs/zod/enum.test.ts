import {
    describe,
    it,
} from 'vitest';

import { CommonStatus } from '../../../src/constants';
import * as z from '../../../src/libs/zod';

enum TestStatus {
    Disabled = 0,
    Enabled = 1,
}

describe.concurrent('enum with meta', () => {
    it('should preserve enum parsing behavior', ({ expect }) => {
        const schema = z.enumWithMeta('TestStatus', TestStatus);

        expect(schema.safeParse(TestStatus.Enabled).success).toBe(true);
        expect(schema.safeParse(99).success).toBe(false);
    });

    it('should attach varnames and provided descriptions as metadata', ({ expect }) => {
        const schema = z.enumWithMeta(
            'TestStatus',
            TestStatus,
            'test status',
            {
                [TestStatus.Disabled]: 'disabled',
                [TestStatus.Enabled]: 'enabled',
            },
        );

        expect(schema.description).toBe('test status');
        expect(schema.meta()).toMatchObject({
            'id': 'TestStatus',
            'x-enum-descriptions': [
                'disabled',
                'enabled',
            ],
            'x-enum-varnames': [
                'Disabled',
                'Enabled',
            ],
        });
    });

    it('should fall back to common status text metadata', ({ expect }) => {
        const schema = z.enumWithMeta('CommonStatus', CommonStatus);

        expect(schema.meta()?.['x-enum-descriptions']).toContain('成功');
    });
});
