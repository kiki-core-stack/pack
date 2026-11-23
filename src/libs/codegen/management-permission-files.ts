import { rm } from 'node:fs/promises';

import { Path } from '@kikiutils/shared/classes/path';
import type { PathLike } from '@kikiutils/shared/classes/path';
import { upperFirst } from 'es-toolkit';
import {
    objectEntries,
    objectKeys,
} from 'ts-extras';

import type { ManagementType } from '../../types';
import type { LocaleCatalogs } from '../../types/i18n';

import { fetchApiData } from './_internals/fetch-api-data';
import { writeGeneratedFile } from './_internals/write-generated-file';

interface GenerateManagementPermissionFilesOptions {
    /**
     * Base URL of the running development backend.
     */
    apiBaseUrl: string;
    managementType: ManagementType;

    /**
     * Receives `index.ts` (keys, types, requirements) and `messages/<locale>.ts` (labels as vue-i18n messages, one file
     * per locale so the frontend loads only the current one).
     */
    targetDirectoryPath: PathLike;
}

/**
 * Generates the permission files of a management frontend: group/key arrays, their union types, each key's required
 * keys, and per-locale labels of every group and key (all defined with the permissions in the backend).
 *
 * Needs the development-only backend route `GET /api/<managementType>/<managementType>/permission/list` (the
 * management's own principal-management section), which returns the catalog's `{ groups, keys, requirements }` and
 * `labels`, the `PermissionMessages` of every locale.
 */
export async function generateManagementPermissionFiles(options: GenerateManagementPermissionFilesOptions) {
    const { managementType } = options;
    const catalog = await fetchApiData<{
        groups: string[];
        keys: string[];
        labels: LocaleCatalogs<Readonly<Record<string, string>>>;
        requirements: Record<string, string[]>;
    }>(
        `${options.apiBaseUrl}/api/${managementType}/${managementType}/permission/list`,
    );

    const prefix = upperFirst(managementType);
    const toArray = (values: readonly string[]) => [
        '[',
        ...values.toSorted().map((value) => `  '${value}',`),
        '] as const;',
    ];

    const paths = [
        ...catalog.groups,
        ...catalog.keys,
    ].toSorted();

    // Frontends compile these as vue-i18n messages, where the characters are syntax and only fail at runtime.
    for (const [locale, labels] of objectEntries(catalog.labels)) {
        for (const path of paths) {
            if (/[$@{|}]/.test(labels[path] ?? '')) {
                throw new Error(`Permission label "${path}" (${locale}) contains a vue-i18n special character`);
            }
        }
    }

    const requirementMapEntries = objectKeys(catalog.requirements)
        .toSorted()
        .map((key) => `  '${key}': ${JSON.stringify(catalog.requirements[key])},`);

    const fileContents = [
        `export const ${managementType}PermissionGroups = ${toArray(catalog.groups).join('\n')}`,
        '',
        `export const ${managementType}PermissionKeys = ${toArray(catalog.keys).join('\n')}`,
        '',
        `export type ${prefix}PermissionKey = (typeof ${managementType}PermissionKeys)[number];`,
        `export type ${prefix}PermissionGroup = (typeof ${managementType}PermissionGroups)[number];`,
        `export type ${prefix}PermissionMessages = Readonly<Record<${prefix}PermissionGroup | ${prefix}PermissionKey, string>>;`,
        '',
        `export const ${managementType}PermissionRequirementMap: Readonly<Partial<Record<${prefix}PermissionKey, readonly ${prefix}PermissionKey[]>>> = {`,
        ...requirementMapEntries,
        '};',
    ];

    const targetDirectoryPath = new Path(options.targetDirectoryPath);
    // Removed locales must not leave their files behind.
    await rm(
        targetDirectoryPath.join('messages').toString(),
        {
            force: true,
            recursive: true,
        },
    );

    await Promise.all([
        writeGeneratedFile(targetDirectoryPath.join('index.ts'), fileContents),
        ...objectEntries(catalog.labels).map(async ([locale, labels]) => await writeGeneratedFile(
            targetDirectoryPath.join('messages', `${locale}.ts`),
            [
                `import type { ${prefix}PermissionMessages } from '..';`,
                '',
                'export default {',
                ...paths.map((path) => `  '${path}': ${JSON.stringify(labels[path])},`),
                `} satisfies ${prefix}PermissionMessages;`,
            ],
        )),
    ]);
}
