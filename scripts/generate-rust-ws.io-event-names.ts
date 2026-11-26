#!/usr/bin/env node

import {
    lstat,
    mkdir,
    readdir,
    rm,
    writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';

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

async function lstatOrUndefined(path: string) {
    return await lstat(path).catch(
        // A missing path is handled by the callers.
        () => undefined,
    );
}

// Written into the sibling pack-rs checkout. The checks guard the deletion below: it only ever removes `.rs` files of a
// real (non-symlinked) pack-rs directory.
const packRsPath = join(import.meta.dirname, '..', '..', 'pack-rs');
const outputDirPath = join(packRsPath, 'src', 'constants', 'ws_io_event_names');
for (const path of [
    join(packRsPath, 'Cargo.toml'),
    join(packRsPath, 'src', 'constants', 'mod.rs'),
]) {
    if (!(await lstatOrUndefined(path))?.isFile()) throw new Error(`${path} not found; is pack-rs cloned next to pack?`);
}

for (const path of [
    packRsPath,
    join(packRsPath, 'src'),
    join(packRsPath, 'src', 'constants'),
    outputDirPath,
]) {
    if ((await lstatOrUndefined(path))?.isSymbolicLink()) throw new Error(`${path} is a symlink`);
}

await mkdir(outputDirPath, { recursive: true });
const staleEntries = await readdir(outputDirPath, { withFileTypes: true });
const unexpectedEntry = staleEntries.find((entry) => !entry.isFile() || !entry.name.endsWith('.rs'));
if (unexpectedEntry) throw new Error(`Unexpected entry in ${outputDirPath}: ${unexpectedEntry.name}`);
await Promise.all(staleEntries.map(async (entry) => await rm(join(outputDirPath, entry.name))));

await Promise.all(
    objectEntries(WsIoEventNames).map(async ([zone, names]) => {
        const fileName = `${snakeCase(zone)}.rs`;
        const fileContentLines = objectEntries(names).map(
            ([key, value]) => `pub const ${constantCase(key)}: &str = "${value}";`,
        );

        return await writeFile(join(outputDirPath, fileName), `${fileContentLines.join('\n')}\n`);
    }),
);

await writeFile(
    join(outputDirPath, 'mod.rs'),
    `${objectKeys(WsIoEventNames).sort().map((zone) => `pub mod ${snakeCase(zone)};`).join('\n')}\n`,
);
