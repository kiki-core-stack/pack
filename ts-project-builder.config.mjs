import del from 'rollup-plugin-delete';
import { defineConfig } from 'ts-project-builder';

export default defineConfig({
	additionalInputPlugins: { afterBuiltIns: [del({ hook: 'writeBundle', targets: './dist/types/**/*.mjs' })] },
	builtInInputPluginOptions: { nodeExternal: { include: ['mongoose'] } }
});
