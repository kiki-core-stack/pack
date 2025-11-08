import { createConfig } from '@kikiutils/eslint-config';

export default createConfig('node', { type: 'lib' }).overrideRules({
    'ts/explicit-function-return-type': 'off',
    'ts/prefer-literal-enum-member': 'off',
});
