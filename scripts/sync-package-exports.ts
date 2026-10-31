#!/usr/bin/env node

// Linux-only script: path handling intentionally assumes POSIX separators.

import { Path } from '@kikiutils/shared/classes/path';
import type { PackageJson } from 'type-fest';

interface PackageExportEntry {
    import: null | string;
    require: null;
    types: null | string;
}

// Constants/Variables
const packageJsonPath = new Path(import.meta.dirname, '../package.json');
const privatePathNames = new Set([
    '_internal',
    '_internals',
    'internal',
    'internals',
]);

const sourceDirectoryPath = new Path(import.meta.dirname, '../src');

// Functions
async function createPackageExports() {
    const exports: Record<string, null | PackageExportEntry | string> = { './package.json': './package.json' };

    for (const filePath of await sourceDirectoryPath.readdir({ recursive: true })) {
        if (!filePath.endsWith('.ts') || filePath.split('/').some((name) => name.startsWith('.'))) continue;
        const parsedPath = new Path(filePath).parse();
        const sourcePath = `./src/${filePath}`;
        const exportPath = `./${new Path(parsedPath.dir, parsedPath.name)}`;

        if (
            [
                ...parsedPath.dir.split('/'),
                parsedPath.name,
            ].some((name) => privatePathNames.has(name))
        ) {
            exports[exportPath] = null;
            continue;
        }

        if (parsedPath.name !== 'index') continue;

        const directoryExportPath = parsedPath.dir ? `./${parsedPath.dir}` : '.';
        exports[directoryExportPath] = {
            /* eslint-disable perfectionist/sort-objects */
            types: sourcePath,
            import: parsedPath.dir.startsWith('types') ? null : sourcePath,
            require: null,
            /* eslint-enable perfectionist/sort-objects */
        };

        exports[exportPath] = null;
    }

    return {
        ...Object.fromEntries(Object.entries(exports).sort(([left], [right]) => left.localeCompare(right))),
        './*': './src/*.ts',
    };
}

const packageJson = JSON.parse(await packageJsonPath.readFile('utf8')) as PackageJson;
packageJson.exports = await createPackageExports();
await packageJsonPath.writeFile(`${JSON.stringify(packageJson, null, 2)}\n`);
