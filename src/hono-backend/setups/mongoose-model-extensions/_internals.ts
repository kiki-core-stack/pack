/**
 * Functions adding the project's statics and methods to every schema before its model is built.
 */
export const registerModelExtensions: Array<(...args: any) => void> = [];
