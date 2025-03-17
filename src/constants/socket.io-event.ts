// eslint-disable-next-line style/max-len
type LowercaseUppercaseLetters<T extends string> = T extends `${infer First}${infer Rest}` ? First extends Uppercase<First> ? `${Lowercase<First>}${LowercaseUppercaseLetters<Rest>}` : LowercaseUppercaseLetters<Rest> : '';

function createEnumObject<N extends string, T extends string[]>(name: N, keys: T) {
    const enumObject: Dict<string> = {};
    new Set(keys).forEach((key) => enumObject[key] = `${name}.${key}`.replace(/[a-z]/g, '').toLowerCase());
    // eslint-disable-next-line style/max-len
    return Object.freeze(enumObject as { [key in T[number]]: `${LowercaseUppercaseLetters<N>}.${LowercaseUppercaseLetters<key>}` });
}

export const ToAdminBackend = createEnumObject(
    'ToAdminBackend',
    [] as const,
);

export const ToAdminFrontend = createEnumObject(
    'ToAdminFrontend',
    [] as const,
);

export const ToServer = createEnumObject(
    'ToServer',
    ['Test'] as const,
);

export const SocketIoEvent = {
    ToAdminBackend,
    ToAdminFrontend,
    ToServer,
};
