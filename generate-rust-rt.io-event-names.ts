import {
    mkdir,
    rm,
    writeFile,
} from 'node:fs/promises';
import {
    join,
    resolve,
} from 'node:path';

import {
    constantCase,
    snakeCase,
} from 'es-toolkit';

import * as RtIoEventNames from './src/constants/rt.io-event-names.ts';

const outputDirPath = resolve(import.meta.dirname, 'generated', 'io_event_names');
await rm(
    outputDirPath,
    {
        force: true,
        recursive: true,
    },
);

await mkdir(outputDirPath, { recursive: true });
await Promise.all(
    Object.entries(RtIoEventNames).map(([zone, names]) => {
        const fileName = `${snakeCase(zone)}.rs`;
        const fileContentLines = Object
            .entries(names)
            .map(([key, value]) => `pub const ${constantCase(key)}: &str = "${value}";`);

        return writeFile(join(outputDirPath, fileName), `${fileContentLines.join('\n')}\n`);
    }),
);
