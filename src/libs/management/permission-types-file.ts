import { Path } from '@kikiutils/shared/classes/path';
import { upperFirst } from 'es-toolkit';

import type { ManagementType } from '../../types';

/**
 * Writes the catalog for a frontend: key/group arrays plus their union types.
 *
 * Frontends type their translations on these (`Record<AdminPermission, string>`), so a permission added or renamed in
 * the backend breaks their type check until translated.
 */
export async function writeManagementPermissionTypesFile(
    managementType: ManagementType,
    catalog: { groups: readonly string[]; keys: readonly string[] },
    targetFilePath: string,
) {
    const prefix = upperFirst(managementType);
    const toArray = (values: readonly string[]) => [
        '[',
        ...values.toSorted().map((value) => `  '${value}',`),
        '] as const;',
    ];

    const fileContents = [
        '/* eslint-disable eslint-comments/no-unlimited-disable */',
        '/* eslint-disable */',
        '',
        `export const ${managementType}PermissionGroups = ${toArray(catalog.groups).join('\n')}`,
        '',
        `export const ${managementType}Permissions = ${toArray(catalog.keys).join('\n')}`,
        '',
        `export type ${prefix}Permission = (typeof ${managementType}Permissions)[number];`,
        `export type ${prefix}PermissionGroup = (typeof ${managementType}PermissionGroups)[number];`,
    ];

    const targetPath = new Path(targetFilePath);
    await targetPath.parent.mkdir({ recursive: true });
    await targetPath.writeFile(`${fileContents.join('\n')}\n`);
}
