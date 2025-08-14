import {
    mkdir,
    writeFile,
} from 'node:fs/promises';
import { dirname } from 'node:path';

export async function writeAdminPermissionTypesFile(permissions: string[], targetFilePath: string) {
    permissions = permissions.toSorted();
    const virtualPermissionsSet = new Set<string>();
    permissions.forEach((permission) => {
        const parts = permission.split('.');
        for (let i = 1; i < parts.length; i++) virtualPermissionsSet.add(parts.slice(0, i).join('.'));
    });

    const virtualPermissions = [...virtualPermissionsSet].sort();
    const fileContents = [
        'export type AdminPermission =',
        ...permissions.map((path, index) => `  | '${path}'${index === permissions.length - 1 ? ';' : ''}`),
        '',
        'export type VirtualAdminPermission =',
        ...virtualPermissions.map((path, index) => {
            return `  | '${path}'${index === virtualPermissions.length - 1 ? ';' : ''}`;
        }),
    ];

    await mkdir(dirname(targetFilePath), { recursive: true });
    await writeFile(targetFilePath, `${fileContents.join('\n')}\n`);
}
