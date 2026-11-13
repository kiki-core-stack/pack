import type { PathLike } from '@kikiutils/shared/classes/path';
import { upperFirst } from 'es-toolkit';

import type { ManagementType } from '../../types';
import type { LocalizedMessages } from '../../types/i18n';

import { fetchApiData } from './_internals/fetch-api-data';
import { writeGeneratedFile } from './_internals/write-generated-file';

interface GenerateManagementPermissionTypesFileOptions {
    /**
     * Base URL of the running development backend.
     */
    apiBaseUrl: string;
    managementType: ManagementType;
    targetFilePath: PathLike;
}

/**
 * Generates the permission file of a management frontend: group/key arrays, their union types and the label of every
 * group and key (defined with the permissions in the backend).
 *
 * Needs the development-only backend route `GET /api/<managementType>/<managementType>/permission/list` (the
 * management's own principal-management section), which returns the catalog's `{ groups, keys, labels }`.
 */
export async function generateManagementPermissionTypesFile(options: GenerateManagementPermissionTypesFileOptions) {
    const { managementType } = options;
    const catalog = await fetchApiData<{
        groups: string[];
        keys: string[];
        labels: Record<string, LocalizedMessages>;
    }>(
        `${options.apiBaseUrl}/api/${managementType}/${managementType}/permission/list`,
    );

    const prefix = upperFirst(managementType);
    const toArray = (values: readonly string[]) => [
        '[',
        ...values.toSorted().map((value) => `  '${value}',`),
        '] as const;',
    ];

    const labelMapEntries = [
        ...catalog.groups,
        ...catalog.keys,
    ]
        .toSorted()
        .map((path) => `  '${path}': ${JSON.stringify(catalog.labels[path])},`);

    const fileContents = [
        `import type { LocalizedMessages } from '@kcs-project/pack/types/i18n';`,
        '',
        `export const ${managementType}PermissionGroups = ${toArray(catalog.groups).join('\n')}`,
        '',
        `export const ${managementType}PermissionKeys = ${toArray(catalog.keys).join('\n')}`,
        '',
        `export type ${prefix}PermissionKey = (typeof ${managementType}PermissionKeys)[number];`,
        `export type ${prefix}PermissionGroup = (typeof ${managementType}PermissionGroups)[number];`,
        '',
        `export const ${managementType}PermissionLabelMap: Readonly<Record<${prefix}PermissionGroup | ${prefix}PermissionKey, LocalizedMessages>> = {`,
        ...labelMapEntries,
        '};',
    ];

    await writeGeneratedFile(options.targetFilePath, fileContents);
}
