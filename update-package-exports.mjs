import { readJson, writeJson } from '@kikiutils/fs-extra';
import { glob } from 'glob';
import { fromPairs, merge, sortBy, toPairs } from 'lodash-es';
import { dirname } from 'node:path';

(async () => {
    const exports = {
        './*': { import: './*.mjs', types: './*.d.ts' },
        './types/*': { types: './types/*.d.ts' },
    };

    const filePaths = await glob(['**/index.d.ts', '**/index.mjs'], { cwd: './dist' });
    filePaths.forEach((filePath) => {
        const dirPath = dirname(filePath);
        const isDts = filePath.endsWith('index.d.ts');
        merge(exports, {
            [`./${dirPath}`]: {
                import: !isDts ? `./${filePath}` : undefined,
                types: isDts ? `./${dirPath}/index.d.ts` : undefined,
            },
        });
    });

    const packageJson = await readJson('./package.json');
    packageJson.exports = fromPairs(sortBy(toPairs(exports), [0]));
    await writeJson('./package.json', packageJson, { spaces: 2 });
})();
