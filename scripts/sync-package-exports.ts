#!/usr/bin/env node

// Linux-only script: path handling intentionally assumes POSIX separators.

import { Path } from '@kikiutils/shared/classes/path';
import { objectEntries } from 'ts-extras';
import type { PackageJson } from 'type-fest';
import typescript from 'typescript';

type PackageExportTarget = null | string | TypesOnlyExportTarget;

interface TypesOnlyExportTarget {
    default: null;
    types: string;
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
async function assertTypesOnlyModule(filePath: string) {
    const { outputText } = typescript.transpileModule(
        await sourceDirectoryPath.join(filePath).readFile('utf8'),
        {
            compilerOptions: {
                module: typescript.ModuleKind.ESNext,
                removeComments: true,
                target: typescript.ScriptTarget.ESNext,
            },
            fileName: filePath,
        },
    );

    if (outputText.replace(/^export \{\};$/m, '').trim()) {
        throw new Error(`Types-only module "src/${filePath}" must not contain runtime code`);
    }
}

function createExportTarget(sourcePath: string, typesOnly: boolean): PackageExportTarget {
    if (!typesOnly) return sourcePath;
    return {
        /* eslint-disable perfectionist/sort-objects */
        types: sourcePath,
        default: null,
        /* eslint-enable perfectionist/sort-objects */
    };
}

/**
 * Exposes every non-private source module through `./*`, with explicit entries for directory indexes.
 *
 * - Private modules (`_internal`, `_internals`, `internal`, `internals` path segments), declaration files,
 *   hidden paths and `index` aliases are blocked with `null`.
 * - Modules under a `types` path segment or named `types` are exported as types only.
 * - Explicit entries precede the wildcards and `./*` comes last, because TypeScript generates auto-import
 *   specifiers from the first matching key.
 */
async function createPackageExports() {
    const exports: Record<string, PackageExportTarget> = { './package.json': './package.json' };
    const typesDirectories = new Set<string>();

    for (const filePath of await sourceDirectoryPath.readdir({ recursive: true })) {
        if (!filePath.endsWith('.ts')) continue;
        const parsedPath = new Path(filePath).parse();
        const segments = [
            ...parsedPath.dir.split('/').filter(Boolean),
            parsedPath.name,
        ];

        const sourcePath = `./src/${filePath}`;
        const exportPath = `./${segments.join('/')}`;
        if (
            filePath.endsWith('.d.ts')
            || segments.some((segment) => segment.startsWith('.') || privatePathNames.has(segment))
        ) {
            exports[exportPath] = null;
            continue;
        }

        const typesSegmentIndex = segments.indexOf('types');
        const typesOnly = typesSegmentIndex !== -1;
        if (typesOnly) await assertTypesOnlyModule(filePath);
        const inTypesDirectory = typesOnly && typesSegmentIndex < segments.length - 1;
        if (inTypesDirectory) typesDirectories.add(segments.slice(0, typesSegmentIndex + 1).join('/'));

        if (parsedPath.name === 'index') {
            exports[parsedPath.dir ? `./${parsedPath.dir}` : '.'] = createExportTarget(sourcePath, typesOnly);
            exports[exportPath] = null;
        } else if (typesOnly && !inTypesDirectory) {
            exports[exportPath] = createExportTarget(sourcePath, true);
        }
    }

    for (const directory of typesDirectories) exports[`./${directory}/*`] = createExportTarget(`./src/${directory}/*.ts`, true);

    const getKeyGroup = (key: string) => {
        if (exports[key] === null) return 2;
        return key.includes('*') ? 1 : 0;
    };

    const entries = objectEntries(exports);
    entries.sort(([a], [b]) => getKeyGroup(a) - getKeyGroup(b) || a.localeCompare(b));
    return {
        ...Object.fromEntries(entries),
        './*': './src/*.ts',
    };
}

const packageJson = JSON.parse(await packageJsonPath.readFile('utf8')) as PackageJson;
packageJson.exports = await createPackageExports();
await packageJsonPath.writeFile(`${JSON.stringify(packageJson, null, 2)}\n`);
