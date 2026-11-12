import type { PathLike } from '@kikiutils/shared/classes/path';
import { upperFirst } from 'es-toolkit';

import type { ManagementType } from '../../types';

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
 * Generates the permission file of a management frontend: group/key arrays plus their union types.
 *
 * Frontends type their translations on these (`Record<AdminPermissionKey, string>`), so a permission added or
 * renamed in the backend breaks their type check until translated.
 *
 * Needs the development-only backend route `GET /api/<managementType>/<managementType>/permission/list` (the
 * management's own principal-management section), which returns `{ groups, keys }`.
 */
export async function generateManagementPermissionTypesFile(options: GenerateManagementPermissionTypesFileOptions) {
    const { managementType } = options;
    const catalog = await fetchApiData<{ groups: string[]; keys: string[] }>(
        `${options.apiBaseUrl}/api/${managementType}/${managementType}/permission/list`,
    );

    const prefix = upperFirst(managementType);
    const toArray = (values: readonly string[]) => [
        '[',
        ...values.toSorted().map((value) => `  '${value}',`),
        '] as const;',
    ];

    const fileContents = [
        `export const ${managementType}PermissionGroups = ${toArray(catalog.groups).join('\n')}`,
        '',
        `export const ${managementType}PermissionKeys = ${toArray(catalog.keys).join('\n')}`,
        '',
        `export type ${prefix}PermissionKey = (typeof ${managementType}PermissionKeys)[number];`,
        `export type ${prefix}PermissionGroup = (typeof ${managementType}PermissionGroups)[number];`,
    ];

    await writeGeneratedFile(options.targetFilePath, fileContents);
}
