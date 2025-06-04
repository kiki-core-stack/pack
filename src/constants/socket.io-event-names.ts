// eslint-disable-next-line style/max-len
type LowercaseUppercaseLetters<T extends string> = T extends `${infer First}${infer Rest}` ? First extends Uppercase<First> ? `${Lowercase<First>}${LowercaseUppercaseLetters<Rest>}` : LowercaseUppercaseLetters<Rest> : '';

function createEnumObject<N extends string, T extends string[]>(name: N, keys: T) {
    const enumObject: Record<string, string> = {};
    new Set(keys).forEach((key) => enumObject[key] = `${name}.${key}`.replace(/[a-z]/g, '').toLowerCase());
    return enumObject as { [key in T[number]]: `${LowercaseUppercaseLetters<N>}.${LowercaseUppercaseLetters<key>}` };
}

export const ToAdminBackend = /* @__PURE__ */ createEnumObject(
    'ToAdminBackend',
    [] as const,
);

export const ToAdminFrontend = /* @__PURE__ */ createEnumObject(
    'ToAdminFrontend',
    [] as const,
);

export const ToServer = /* @__PURE__ */ createEnumObject(
    'ToServer',
    ['Test'] as const,
);
