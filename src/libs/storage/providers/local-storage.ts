import Path from '@kikiutils/classes/path';
import type { PathLike } from '@kikiutils/classes/path';
import { checkAndGetEnvValue } from '@kikiutils/node/env';
import { remove } from 'fs-extra';
import type { Buffer } from 'node:buffer';
import {
    chmod,
    writeFile,
} from 'node:fs/promises';

import type {
    LocalStorageProviderConfig,
    StorageProvider,
} from '../types';

export class LocalStorageProvider implements StorageProvider {
    #basePath: Path;

    constructor(config?: LocalStorageProviderConfig) {
        this.#basePath = Path.resolve((config || { basePath: checkAndGetEnvValue('STORAGE_LOCAL_BASE_PATH') }).basePath);
        if (!this.#basePath.mkdirpSync()) throw new Error(`Failed to create or write to the storage directory: "${this.#basePath.toString()}". Please check permissions or ensure the path is correct.`);
    }

    async deleteFile(filePath: PathLike) {
        await remove(this.#basePath.join(filePath).toString());
    }

    async fileExists(filePath: PathLike) {
        return await this.#basePath.join(filePath).access();
    }

    async uploadFile(filePath: PathLike, buffer: Buffer) {
        filePath = this.#basePath.join(filePath);
        const fileDir = filePath.parent;
        await fileDir.mkdirp();
        await fileDir.chmod(0o755);
        await writeFile(filePath.toString(), buffer);
        await chmod(filePath.toString(), 0o644);
        return filePath.toString().replace(this.#basePath.toString(), '');
    }
}
