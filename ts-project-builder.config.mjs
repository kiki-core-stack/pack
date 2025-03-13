import del from 'rollup-plugin-delete';
import { defineConfig } from 'ts-project-builder';

export default defineConfig({
    additionalInputPlugins: {
        afterBuiltIns: [
            del({
                hook: 'writeBundle',
                targets: [
                    './dist/libs/storage/types.mjs',
                    './dist/models/**/types.mjs',
                    './dist/types/**/*.mjs',
                ],
            }),
        ],
    },
    builtInInputPluginOptions: { nodeExternal: { devDeps: true } },
});
