import type { ReadonlyRecord } from '@kikiutils/shared/types';

export type PermissionGroups<T extends PermissionTree, Prefix extends string = ''> = {
    [K in keyof T & string]: T[K] extends PermissionGroupNode
        ? `${Prefix}${K}` | PermissionGroups<T[K]['children'], `${Prefix}${K}.`>
        : never;
}[keyof T & string];

export type PermissionKeys<T extends PermissionTree, Prefix extends string = ''> = {
    [K in keyof T & string]: T[K] extends PermissionGroupNode
        ? PermissionKeys<T[K]['children'], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
}[keyof T & string];

export type PermissionMap<T extends PermissionTree, Prefix extends string = ''> = {
    readonly [K in keyof T & string]: T[K] extends PermissionGroupNode
        ? PermissionMap<T[K]['children'], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
};

/**
 * Labels of every group and permission of a catalog, keyed by path; part of each locale catalog of the layer that
 * defines the permissions (`permissions: { admin: PermissionMessages<typeof adminPermissionCatalog> }`).
 */
export type PermissionMessages<C extends Readonly<Record<'groups' | 'keys', readonly string[]>>> = ReadonlyRecord<
  | C['groups'][number]
  | C['keys'][number],
  string
>;

/**
 * A permission key, or `group.*` for "any permission within the group".
 *
 * Takes plain unions so both sides can use it: backends via `PermissionGroups<T>`/`PermissionKeys<T>`, frontends via
 * their generated group/key unions.
 */
export type PermissionPattern<Group extends string, Key extends string> = `${Group}.*` | Key;

/**
 * A pattern, or `!pattern` to exclude matches from the other patterns of the same requirement.
 */
export type PermissionRequirement<Group extends string, Key extends string> =
  | `!${PermissionPattern<Group, Key>}`
  | PermissionPattern<Group, Key>;

/**
 * Permission definition tree: named groups (`{ children }`) and permissions (`{ requires? }`), e.g.
 * `{ admin: { children: { create: { requires: ['list'] }, list: {} } } }`.
 */
export type PermissionTree = { readonly [Name in string]: PermissionGroupNode | PermissionLeafNode };

export interface PermissionCatalog<T extends PermissionTree = PermissionTree> {
    /**
     * Every group path (`admin`, `admin.role`), in definition order.
     */
    readonly groups: ReadonlyArray<PermissionGroups<T>>;

    /**
     * Every permission key (`admin.role.create`), in definition order.
     */
    readonly keys: ReadonlyArray<PermissionKeys<T>>;

    /**
     * The definition tree with each leaf replaced by its full key: `permissions.admin.role.create`.
     */
    readonly permissions: PermissionMap<T>;

    /**
     * Every key's required keys, resolved to full keys and including indirect ones (keys without requirements are
     * absent).
     */
    readonly requirements: Readonly<Partial<Record<PermissionKeys<T>, ReadonlyArray<PermissionKeys<T>>>>>;
}

export interface PermissionGroupNode {
    readonly children: PermissionTree;
}

export interface PermissionLeafNode {
    /**
     * Permissions this one is unusable without (e.g. `create` needs `list` to reach the page): sibling action names
     * (`list`) or full keys of other nodes (`admin.role.list`).
     */
    readonly requires?: readonly string[];
}

export interface PrincipalPermissions {
    permissions: string[];

    /**
     * Passes every permission check (e.g. a super admin).
     */
    unrestricted: boolean;
}
