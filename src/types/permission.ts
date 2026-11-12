export type PermissionGroups<T extends PermissionTree, Prefix extends string = ''> = {
    [K in keyof T & string]: T[K] extends PermissionTree
        ? `${Prefix}${K}` | PermissionGroups<T[K], `${Prefix}${K}.`>
        : never;
}[keyof T & string];

export type PermissionKeys<T extends PermissionTree, Prefix extends string = ''> = {
    [K in keyof T & string]: T[K] extends PermissionTree
        ? PermissionKeys<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
}[keyof T & string];

export type PermissionMap<T extends PermissionTree, Prefix extends string = ''> = {
    readonly [K in keyof T & string]: T[K] extends PermissionTree
        ? PermissionMap<T[K], `${Prefix}${K}.`>
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
 * Permission definition tree: nested group objects whose leaves are `true`, e.g. `{ admin: { create: true } }`.
 */
export type PermissionTree = { readonly [Name in string]: PermissionTree | true };

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
}

export interface PrincipalPermissions {
    permissions: string[];

    /**
     * Passes every permission check (e.g. a super admin).
     */
    unrestricted: boolean;
}
