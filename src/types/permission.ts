import type { LocalizedMessages } from './i18n';

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
 * Permission definition tree: named groups (`{ label, children }`) and permissions (`{ label }`), e.g.
 * `{ admin: { label, children: { create: { label } } } }`.
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
     * Label of every group and key.
     */
    readonly labels: Readonly<Record<PermissionGroups<T> | PermissionKeys<T>, LocalizedMessages>>;

    /**
     * The definition tree with each leaf replaced by its full key: `permissions.admin.role.create`.
     */
    readonly permissions: PermissionMap<T>;
}

export interface PermissionGroupNode {
    readonly children: PermissionTree;
    readonly label: LocalizedMessages;
}

export interface PermissionLeafNode {
    readonly label: LocalizedMessages;
}

export interface PrincipalPermissions {
    permissions: string[];

    /**
     * Passes every permission check (e.g. a super admin).
     */
    unrestricted: boolean;
}
