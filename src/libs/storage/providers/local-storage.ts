import type { Buffer } from 'node:buffer';
import { writeFile } from 'node:fs/promises';

import { Path } from '@kikiutils/classes/path';
import type { PathLike } from '@kikiutils/classes/path';
import { checkAndGetEnvValue } from '@kikiutils/node/env';
import { remove } from 'fs-extra';

import type { LocalStorageProviderConfig } from '../types';

import { AbstractStorageProvider } from './base';

export class LocalStorageProvider extends AbstractStorageProvider {
    #basePath: Path;

    constructor(config?: LocalStorageProviderConfig) {
        super();
        this.#basePath = Path.resolve(
            (config || { basePath: checkAndGetEnvValue('STORAGE_LOCAL_BASE_PATH') }).basePath,
        );

        if (!this.#basePath.mkdirpSync()) {
            // eslint-disable-next-line style/max-len
            throw new Error(`Failed to create or write to the storage directory: "${this.#basePath.toString()}". Please check permissions or ensure the path is correct.`);
        }
    }

    async deleteFile(filePath: PathLike) {
        await remove(this.#basePath.join(filePath).toString());
    }

    async fileExists(filePath: PathLike) {
        return await this.#basePath.join(filePath).access();
    }

    async uploadFile(buffer: Buffer, filePath?: PathLike, extension?: string) {
        if (!filePath) filePath = this.generateFilePath(buffer, extension);
        filePath = this.#basePath.join(filePath);
        const fileDir = filePath.parent;
        await fileDir.mkdirp({ mode: 0o755 });
        await writeFile(filePath.toString(), buffer, { mode: 0o644 });
        return filePath.toString().replace(this.#basePath.toString(), '');
    }
}
