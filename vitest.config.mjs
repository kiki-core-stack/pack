import { readFile } from 'node:fs/promises';

import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [
        {
            async load(id) {
                if (!id.endsWith('.lua')) return;
                const source = await readFile(id, 'utf8');
                return `export default ${JSON.stringify(source)};`;
            },
            name: 'lua-text',
        },
    ],
    test: {
        coverage: {
            include: ['src/**/*'],
            reporter: [
                'text',
                'lcov',
            ],
        },
    },
});
