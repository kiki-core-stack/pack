import Path from '@kikiutils/classes/path';
import type { PathLike } from '@kikiutils/classes/path';
import { checkAndGetEnvValue } from '@kikiutils/node/env';
import type { Buffer } from 'node:buffer';

import type { StorageProvider } from './base';

export class LocalStorageProvider implements StorageProvider {
    #basePath: Path;

    constructor() {
        this.#basePath = Path.resolve(checkAndGetEnvValue('STORAGE_LOCAL_PATH'));
        if (!this.#basePath.mkdirpSync()) throw new Error(`Failed to create or write to the storage directory: "${this.#basePath.toString()}". Please check permissions or ensure the path is correct.`);
    }

    async deleteFile(filePath: PathLike) {
        await this.#basePath.join(filePath).remove();
    }

    async uploadFile(filePath: PathLike, buffer: Buffer) {
        filePath = this.#basePath.join(filePath);
        await filePath.writeFile(buffer);
        await filePath.chmod(0o644);
        return filePath.toString().replace(this.#basePath.toString(), '');
    }
}
