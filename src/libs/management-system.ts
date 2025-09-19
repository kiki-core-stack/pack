import {
    mkdir,
    writeFile,
} from 'node:fs/promises';
import { dirname } from 'node:path';

import { capitalize } from 'es-toolkit';

import type { ManagementSystemType } from '../types';

export async function writeManagementSystemPermissionTypesFile(
    managementSystemType: ManagementSystemType,
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
    const prefix = capitalize(managementSystemType);
    const fileContents = [
        `export type ${prefix}Permission =`,
        ...permissions.map((path, index) => `  | '${path}'${index === permissions.length - 1 ? ';' : ''}`),
        '',
        `export type ${prefix}PermissionGroup =`,
        ...permissionGroups.map((path, index) => {
            return `  | '${path}'${index === permissionGroups.length - 1 ? ';' : ''}`;
        }),
    ];

    await mkdir(dirname(targetFilePath), { recursive: true });
    await writeFile(targetFilePath, `${fileContents.join('\n')}\n`);
}
