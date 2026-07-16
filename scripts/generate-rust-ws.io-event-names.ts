#!/usr/bin/env node

import {
    mkdir,
    rm,
    writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';

import {
    constantCase,
    snakeCase,
} from 'es-toolkit';

// @ts-expect-error Ignore this error.
import * as WsIoEventNames from '../src/constants/ws.io-event-names.ts';

const outputDirPath = join(import.meta.dirname, '..', 'generated', 'ws_io_event_names');
await rm(
    outputDirPath,
    {
        force: true,
        recursive: true,
    },
);

await mkdir(outputDirPath, { recursive: true });
await Promise.all(
    Object.entries(WsIoEventNames).map(([zone, names]) => {
        const fileName = `${snakeCase(zone)}.rs`;
        const fileContentLines = Object
            .entries(names)
            .map(([key, value]) => `pub const ${constantCase(key)}: &str = "${value}";`);

        return writeFile(join(outputDirPath, fileName), `${fileContentLines.join('\n')}\n`);
    }),
);
