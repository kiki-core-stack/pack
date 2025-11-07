/**
 * Note that the key value represented by the returned types is not equal to the key used in the actual transmission.
 */
function createEnumObject<N extends string, T extends string[]>(name: N, keys: T) {
    const enumObject: Record<string, string> = {};
    new Set(keys).forEach((key) => {
        const fullKey = `${name}${key}`;
        let hash = 0;
        for (const char of fullKey) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
        enumObject[key] = `${fullKey.replace(/[a-z]/g, '').toLowerCase()}${hash.toString(36).slice(0, 3)}`;
    });

    return enumObject as { [K in T[number]]: `${N}.${K}` };
}

export const ToAdminFrontend = /* @__PURE__ */ createEnumObject(
    'ToAdminFrontend',
    [] as const,
);

export const ToManagementBackend = /* @__PURE__ */ createEnumObject(
    'ToManagementBackend',
    [] as const,
);

export const ToServer = /* @__PURE__ */ createEnumObject(
    'ToServer',
    ['Test'] as const,
);
