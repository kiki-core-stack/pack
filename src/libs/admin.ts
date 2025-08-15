import {
    mkdir,
    writeFile,
} from 'node:fs/promises';
import { dirname } from 'node:path';

export async function writeAdminPermissionTypesFile(permissions: string[], targetFilePath: string) {
    permissions = permissions.toSorted();
    const permissionGroupsSet = new Set<string>();
    permissions.forEach((permission) => {
        const parts = permission.split('.');
        for (let i = 1; i < parts.length; i++) permissionGroupsSet.add(parts.slice(0, i).join('.'));
    });

    const permissionGroups = [...permissionGroupsSet].sort();
    const fileContents = [
        'export type AdminPermission =',
        ...permissions.map((path, index) => `  | '${path}'${index === permissions.length - 1 ? ';' : ''}`),
        '',
        'export type AdminPermissionGroup =',
        ...permissionGroups.map((path, index) => {
            return `  | '${path}'${index === permissionGroups.length - 1 ? ';' : ''}`;
        }),
    ];

    await mkdir(dirname(targetFilePath), { recursive: true });
    await writeFile(targetFilePath, `${fileContents.join('\n')}\n`);
}
