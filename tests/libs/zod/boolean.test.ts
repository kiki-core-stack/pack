import {
    describe,
    it,
} from 'vitest';
import * as z from 'zod';

import { coerceBooleanStrict } from '../../../src/libs/zod/boolean';

describe.concurrent('coerceBooleanStrict', () => {
    describe.concurrent('valid boolean coercions', () => {
        it('should accept boolean true', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse(true);

            expect(result.success).toBe(true);
            expect(result.data).toBe(true);
        });

        it('should accept boolean false', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse(false);

            expect(result.success).toBe(true);
            expect(result.data).toBe(false);
        });

        it('should coerce string "true" to boolean true', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('true');

            expect(result.success).toBe(true);
            expect(result.data).toBe(true);
        });

        it('should coerce string "false" to boolean false', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('false');

            expect(result.success).toBe(true);
            expect(result.data).toBe(false);
        });
    });

    describe.concurrent('invalid inputs', () => {
        it('should reject string "TRUE" (uppercase)', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('TRUE');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject string "FALSE" (uppercase)', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('FALSE');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject string "True" (mixed case)', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('True');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject string "False" (mixed case)', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('False');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject number 1', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse(1);

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received number');
            }
        });

        it('should reject number 0', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse(0);

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received number');
            }
        });

        it('should reject string "1"', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('1');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject string "0"', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('0');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject string "yes"', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('yes');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject string "no"', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('no');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject empty string', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject null', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse(null);

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received null');
            }
        });

        it('should reject undefined', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse(undefined);

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received undefined');
            }
        });

        it('should reject object', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse({});

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received object');
            }
        });

        it('should reject array', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse([]);

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received array');
            }
        });

        it('should reject string with spaces "true "', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse('true ');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });

        it('should reject string with spaces " false"', ({ expect }) => {
            const schema = coerceBooleanStrict();
            const result = schema.safeParse(' false');

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received string');
            }
        });
    });

    describe.concurrent('integration with Zod methods', () => {
        it('should work with optional()', ({ expect }) => {
            const schema = coerceBooleanStrict().optional();
            const result = schema.safeParse(undefined);

            expect(result.success).toBe(true);
            expect(result.data).toBeUndefined();
        });

        it('should work with nullable()', ({ expect }) => {
            const schema = coerceBooleanStrict().nullable();
            const result = schema.safeParse(null);

            expect(result.success).toBe(true);
            expect(result.data).toBeNull();
        });

        it('should work with default()', ({ expect }) => {
            const schema = coerceBooleanStrict().default(true);
            const result = schema.safeParse(undefined);

            expect(result.success).toBe(true);
            expect(result.data).toBe(true);
        });

        it('should work in object schema', ({ expect }) => {
            const objectSchema = z.object({
                enabled: coerceBooleanStrict(),
                isActive: coerceBooleanStrict(),
            });

            const result = objectSchema.safeParse({
                enabled: false,
                isActive: 'true',
            });

            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                enabled: false,
                isActive: true,
            });
        });

        it('should work in array schema', ({ expect }) => {
            const arraySchema = z.array(coerceBooleanStrict());
            const result = arraySchema.safeParse([
                true,
                'false',
                'true',
                false,
            ]);

            expect(result.success).toBe(true);
            expect(result.data).toEqual([
                true,
                false,
                true,
                false,
            ]);
        });
    });

    describe.concurrent('edge cases', () => {
        it('should handle boolean objects created with Boolean constructor', ({ expect }) => {
            const schema = coerceBooleanStrict();
            // eslint-disable-next-line no-new-wrappers, unicorn/new-for-builtins
            const booleanObject = new Boolean(true);
            const result = schema.safeParse(booleanObject);

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.code).toBe('invalid_type');
            if (result.error?.issues[0]?.code === 'invalid_type') {
                expect(result.error.issues[0].expected).toBe('boolean');
                expect(result.error.issues[0].message).toBe('Invalid input: expected boolean, received Boolean');
            }
        });

        it('should maintain strict equality for coerced values', ({ expect }) => {
            const schema = coerceBooleanStrict();

            const trueResult = schema.safeParse('true');
            const falseResult = schema.safeParse('false');

            expect(trueResult.success).toBe(true);
            expect(falseResult.success).toBe(true);

            expect(trueResult.data === true).toBe(true);
            expect(falseResult.data === false).toBe(true);
        });
    });
});
