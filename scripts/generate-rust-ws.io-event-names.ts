#!/usr/bin/env node

import { Path } from '@kikiutils/shared/classes/path';
import {
    constantCase,
    snakeCase,
} from 'es-toolkit';
import {
    objectEntries,
    objectKeys,
} from 'ts-extras';

// @ts-expect-error Ignore this error.
import * as WsIoEventNames from '../src/constants/ws.io-event-names.ts';

const eventNamesByValue = new Map<string, string>();
for (const [zone, names] of objectEntries(WsIoEventNames)) {
    for (const [key, value] of objectEntries(names)) {
        const eventName = `${zone}.${key}`;
        const existingEventName = eventNamesByValue.get(value);
        if (existingEventName !== undefined) {
            throw new Error(`WS.IO event key collision: "${value}" is used by ${existingEventName} and ${eventName}`);
        }

        eventNamesByValue.set(value, eventName);
    }
}

const outputDirPath = new Path(import.meta.dirname, '..', 'generated', 'ws_io_event_names');
await outputDirPath.rm({
    force: true,
    recursive: true,
});

await outputDirPath.mkdir({ recursive: true });
await Promise.all(
    objectEntries(WsIoEventNames).map(async ([zone, names]) => {
        const fileName = `${snakeCase(zone)}.rs`;
        const fileContentLines = objectEntries(names).map(
            ([key, value]) => `pub const ${constantCase(key)}: &str = "${value}";`,
        );

        return await outputDirPath.join(fileName).writeFile(`${fileContentLines.join('\n')}\n`);
    }),
);

await outputDirPath
    .join('mod.rs')
    .writeFile(`${objectKeys(WsIoEventNames).sort().map((zone) => `pub mod ${snakeCase(zone)};`).join('\n')}\n`);
