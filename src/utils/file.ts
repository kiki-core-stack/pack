import type { Blob } from 'node:buffer';

import { WASMagic } from 'wasmagic';

let wasMagic: undefined | WASMagic;

export async function getFileMimeType(file: Blob) {
    return (wasMagic ||= await WASMagic.create()).detect(new Uint8Array(await file.slice(0, 2048).arrayBuffer()));
}
