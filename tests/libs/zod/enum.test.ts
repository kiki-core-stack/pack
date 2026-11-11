import {
    describe,
    it,
} from 'vitest';

import {
    CommonStatus,
    commonStatusToTextMap,
} from '../../../src/constants';
import * as z from '../../../src/libs/zod';

enum TestProvider {
    Local = 'local',
    S3 = 's3',
}

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
        const schema = z.enumWithMeta('TestStatusDocs', TestStatus, { [TestStatus.Enabled]: 'enabled' });

        expect(z.toJSONSchema(z.object({ status: schema.describe('status') }), { io: 'input' })).toMatchObject({
            $defs: {
                TestStatusDocs: {
                    'enum': [
                        0,
                        1,
                    ],
                    'x-enum-descriptions': [
                        'Disabled',
                        'enabled',
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

    it('should use only the given text map, falling back to enum keys', ({ expect }) => {
        const commonSchema = z.toJSONSchema(z.enumWithMeta('CommonStatus', CommonStatus, commonStatusToTextMap));
        const providerSchema = z.toJSONSchema(z.enumWithMeta('TestProvider', TestProvider));
        const statusSchema = z.toJSONSchema(z.enumWithMeta('TestStatusKeys', TestStatus));

        expect(JSON.stringify(commonSchema)).toContain('成功');
        expect(providerSchema.$defs?.TestProvider?.['x-enum-descriptions']).toStrictEqual([
            'Local',
            'S3',
        ]);

        expect(statusSchema.$defs?.TestStatusKeys?.['x-enum-descriptions']).toStrictEqual([
            'Disabled',
            'Enabled',
        ]);
    });
});
