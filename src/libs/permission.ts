import { objectEntries } from 'ts-extras';
import type {
    Arrayable,
    UnknownRecord,

} from 'type-fest';

import type { LocalizedMessages } from '../types/i18n';
import type {
    PermissionCatalog,
    PermissionTree,
    PrincipalPermissions,
} from '../types/permission';

// Functions

/**
 * Defines the permission catalog of one principal type.
 *
 * Groups are `{ label, children }` and permissions `{ label }`; each key is its dotted path. The catalog is the single
 * source of permission keys and labels, so routes reference `permissions.admin.create` instead of repeating strings.
 *
 * @example
 * ```ts
 * export const adminPermissions = definePermissions({
 *     admin: {
 *         children: { create: { label: { 'en': 'Create admins', 'zh-TW': '建立管理員' } } },
 *         label: { 'en': 'Admins', 'zh-TW': '管理員' },
 *     },
 * });
 *
 * adminPermissions.permissions.admin.create; // 'admin.create'
 * ```
 */
export function definePermissions<const T extends PermissionTree>(tree: T): PermissionCatalog<T> {
    const groups: string[] = [];
    const keys: string[] = [];
    const labels: Record<string, LocalizedMessages> = {};
    const walk = (node: PermissionTree, prefix: string) => {
        const entries = objectEntries(node);
        if (!entries.length) throw new Error(`Permission group "${prefix.slice(0, -1) || '<root>'}" has no children`);
        const map: UnknownRecord = {};
        for (const [name, child] of entries) {
            if (!/^[\w-]+$/.test(name)) throw new Error(`Invalid permission name "${name}" under "${prefix}"`);
            const path = `${prefix}${name}`;
            labels[path] = child.label;
            if ('children' in child) {
                groups.push(path);
                map[name] = walk(child.children, `${path}.`);
            } else {
                keys.push(path);
                map[name] = path;
            }
        }

        return map;
    };

    return {
        groups,
        keys,
        labels,
        permissions: walk(tree, ''),
    } as unknown as PermissionCatalog<T>;
}

/**
 * Whether the principal passes the requirement.
 *
 * Each pattern is an exact key or `group.*` (any key within the group). The principal passes when any granted key
 * matches at least one pattern and none of the `!`-prefixed exclusions, e.g. `['catHouse.*', '!catHouse.job.*']` means
 * "some catHouse permission other than job". With only exclusions, every granted key outside them counts.
 */
export function hasPermission(granted: PrincipalPermissions, required: Arrayable<string>) {
    const patterns = [required].flat();
    if (!patterns.length) return false;
    if (granted.unrestricted) return true;
    const excludes = patterns.filter((pattern) => pattern.startsWith('!')).map((pattern) => pattern.slice(1));
    const includes = patterns.filter((pattern) => !pattern.startsWith('!'));
    return granted.permissions.some(
        (key) => (!includes.length || includes.some((pattern) => matchesPermission(pattern, key)))
          && !excludes.some((pattern) => matchesPermission(pattern, key)),
    );
}

function matchesPermission(pattern: string, key: string) {
    return pattern.endsWith('.*') ? key.startsWith(pattern.slice(0, -1)) : key === pattern;
}
