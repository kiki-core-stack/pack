type LowercaseUppercaseLetters<T extends string> = T extends `${infer First}${infer Rest}`
    ? First extends Uppercase<First>
        ? `${Lowercase<First>}${LowercaseUppercaseLetters<Rest>}` : LowercaseUppercaseLetters<Rest>
    : '';

function createEnumObject<N extends string, T extends string[]>(name: N, keys: T) {
    const enumObject: Record<string, string> = {};
    new Set(keys).forEach((key) => {
        const fullKey = `${name}.${key}`;
        let hash = 0;
        for (const char of fullKey) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
        enumObject[key] = `${fullKey.replace(/[a-z]/g, '').toLowerCase()}-${hash.toString(36).slice(0, 3)}`;
    });

    return enumObject as {
        [key in T[number]]: `${LowercaseUppercaseLetters<N>}.${LowercaseUppercaseLetters<key>}-${string}`
    };
}

export const ToManagementSystemBackend = /* @__PURE__ */ createEnumObject(
    'ToManagementSystemBackend',
    [] as const,
);

export const ToManagementSystemFrontend = /* @__PURE__ */ createEnumObject(
    'ToManagementSystemFrontend',
    [] as const,
);

export const ToServer = /* @__PURE__ */ createEnumObject(
    'ToServer',
    ['Test'] as const,
);
