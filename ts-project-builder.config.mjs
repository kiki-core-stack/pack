import {
    readFile,
    rm,
} from 'node:fs/promises';
import { join } from 'node:path';

import { defineConfig } from 'ts-project-builder';

function cleanEmptyMjsFiles() {
    const processFile = async (filePath) => {
        if (!(await readFile(filePath, 'utf-8')).trim()) await rm(filePath, { force: true });
    };

    return {
        name: 'clean-empty-mjs',
        async writeBundle(_, bundle) {
            const promises = Object.keys(bundle).map((fileName) => {
                return fileName.endsWith('.mjs') && processFile(join('./dist', fileName)).catch(() => {});
            });

            await Promise.all(promises);
        },
    };
}

export default defineConfig({
    additionalInputPlugins: { afterBuiltIns: [cleanEmptyMjsFiles()] },
    builtInInputPluginOptions: { nodeExternal: { devDeps: true } },
});
