import {
    fromPairs,
    merge,
    sortBy,
    toPairs,
} from 'lodash-es';
import {
    glob,
    readFile,
    writeFile,
} from 'node:fs/promises';
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

    const filePathsIterator = glob(
        [
            '**/index.d.ts',
            '**/index.mjs',
        ],
        { cwd: './dist' },
    );

    for await (const filePath of filePathsIterator) {
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
    }

    const packageJson = JSON.parse(await readFile('./package.json', 'utf-8'));
    packageJson.exports = fromPairs(sortBy(toPairs(exports), [0]));
    await writeFile('./package.json', JSON.stringify(packageJson, null, 2));
})();
