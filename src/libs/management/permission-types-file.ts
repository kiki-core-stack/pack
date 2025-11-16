import {
    mkdir,
    writeFile,
} from 'node:fs/promises';
import { dirname } from 'node:path';

import { capitalize } from 'es-toolkit';

import type { ManagementType } from '../../types';

export async function writeManagementPermissionTypesFile(
    managementType: ManagementType,
    permissions: string[],
    targetFilePath: string,
) {
    permissions = permissions.toSorted();
    const permissionGroupsSet = new Set<string>();
    permissions.forEach((permission) => {
        const parts = permission.split('.');
        for (let i = 1; i < parts.length; i++) permissionGroupsSet.add(parts.slice(0, i).join('.'));
    });

    const permissionGroups = [...permissionGroupsSet].sort();
    const prefix = capitalize(managementType);
    const fileContents = [
        '/* eslint-disable eslint-comments/no-unlimited-disable */',
        '/* eslint-disable */',
        '',
        `export type ${prefix}Permission =`,
        ...permissions.map((permission, i) => `  | '${permission}'${i === permissions.length - 1 ? ';' : ''}`),
        '',
        `export type ${prefix}PermissionGroup =`,
        ...permissionGroups.map(
            (permissionGroup, i) => `  | '${permissionGroup}'${i === permissionGroups.length - 1 ? ';' : ''}`,
        ),
    ];

    await mkdir(dirname(targetFilePath), { recursive: true });
    await writeFile(targetFilePath, `${fileContents.join('\n')}\n`);
}
