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
 */
export type PermissionPattern<T extends PermissionTree> = `${PermissionGroups<T>}.*` | PermissionKeys<T>;

/**
 * A pattern, or `!pattern` to exclude matches from the other patterns of the same requirement.
 */
export type PermissionRequirement<T extends PermissionTree> = `!${PermissionPattern<T>}` | PermissionPattern<T>;

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
