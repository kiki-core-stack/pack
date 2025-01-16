import {
    readJson,
    writeJson,
} from '@kikiutils/fs-extra';
import { glob } from 'glob';
import {
    fromPairs,
    merge,
    sortBy,
    toPairs,
} from 'lodash-es';
import { dirname } from 'node:path';

(async () => {
    const exports = {
        './*': {
            types: './dist/*.d.ts',
            // eslint-disable-next-line perfectionist/sort-objects
            import: './dist/*.mjs',
        },
        './types/*': { types: './dist/types/*.d.ts' },
    };

    const filePaths = await glob(
        [
            '**/index.d.ts',
            '**/index.mjs',
        ],
        { cwd: './dist' },
    );

    filePaths.forEach((filePath) => {
        const dirPath = dirname(filePath);
        const isDts = filePath.endsWith('index.d.ts');
        merge(
            exports,
            {
                [`./${dirPath}`]: {
                    types: isDts ? `./dist/${dirPath}/index.d.ts` : undefined,
                    // eslint-disable-next-line perfectionist/sort-objects
                    import: !isDts ? `./dist/${filePath}` : undefined,
                },
            },
        );
    });

    const packageJson = await readJson('./package.json');
    packageJson.exports = fromPairs(sortBy(toPairs(exports), [0]));
    await writeJson('./package.json', packageJson, { spaces: 2 });
})();
