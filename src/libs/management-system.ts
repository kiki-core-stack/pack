import type { ManagementSystemType } from '../types';

// Functions
export function getManagementSystemTypeFromRoutePath(path: string): ManagementSystemType | undefined {
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) return 'admin';
}

export async function writeManagementSystemPermissionTypesFile(
    managementSystemType: ManagementSystemType,
    permissions: string[],
    targetFilePath: string,
) {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const { dirname } = await import('node:path');
    const { capitalize } = await import('es-toolkit');

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
