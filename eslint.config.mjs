import { antfu } from '@antfu/eslint-config';
import { createBaseConfigs } from '@kikiutils/eslint-config/base';
import { builtinRules } from 'eslint/use-at-your-own-risk';

export default antfu(
    {
        type: 'lib',
        typescript: true,
    },
    createBaseConfigs(),
    {
        rules: {
            'ts/explicit-function-return-type': 'off',
            'ts/prefer-literal-enum-member': 'off',
        },
    },
    {
        files: ['src/libs/auth/**/*.ts'],
        // A separate name keeps the shared `no-restricted-syntax` list intact for these files.
        plugins: { pack: { rules: { 'no-restricted-auth-syntax': builtinRules.get('no-restricted-syntax') } } },
        rules: {
            'pack/no-restricted-auth-syntax': [
                'error',
                {
                    message: 'Set auth expirations in seconds (`EX`, `EXPIRE`): Dragonfly has reported issues with `PEXPIRE` combined with `NX`.',
                    selector: 'Literal[value=/^(PX|PXAT|PEXPIRE|PEXPIREAT)$/i], CallExpression[callee.property.name=/^pexpire(at)?$/i]',
                },
            ],
        },
    },
);
