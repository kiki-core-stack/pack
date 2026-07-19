#!/usr/bin/env node

// Linux-only script: path handling intentionally assumes POSIX separators.

import {
    glob,
    readFile,
    writeFile,
} from 'node:fs/promises';
import {
    join,
    parse,
} from 'node:path';

import type { PackageJson } from 'type-fest';

interface PackageExportEntry {
    import: null | string;
    require: null;
    types: null | string;
}

const packageJsonPath = join(import.meta.dirname, '../package.json');
const sourceDirectoryPath = join(import.meta.dirname, '../src');

function createBlockedExportEntry(): PackageExportEntry {
    return {
        /* eslint-disable perfectionist/sort-objects */
        types: null,
        import: null,
        require: null,
        /* eslint-enable perfectionist/sort-objects */
    };
}

async function createPackageExports() {
    const exports: Record<string, PackageExportEntry | string> = { './package.json': './package.json' };

    for await (const filePath of glob('**/*.ts', { cwd: sourceDirectoryPath })) {
        const parsedPath = parse(filePath);
        const sourcePath = `./src/${filePath}`;
        const exportPath = `./${join(parsedPath.dir, parsedPath.name)}`;

        if (filePath.includes('_')) {
            exports[exportPath] = createBlockedExportEntry();
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

        exports[exportPath] = createBlockedExportEntry();
    }

    return {
        ...Object.fromEntries(Object.entries(exports).sort(([left], [right]) => left.localeCompare(right))),
        './*': './src/*.ts',
    };
}

const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageJson;
packageJson.exports = await createPackageExports();
await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
