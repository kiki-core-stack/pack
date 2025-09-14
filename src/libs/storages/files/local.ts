import { Path } from '@kikiutils/classes/path';
import type { PathLike } from '@kikiutils/classes/path';
import { toBuffer } from '@kikiutils/shared/buffer';
import { checkAndGetEnvValue } from '@kikiutils/shared/env';
import {
    chmodSync,
    ensureDirSync,
} from 'fs-extra';

import { FileStorageProvider } from '@/constants/file';

import { BaseFileStorage } from './base';
import type { LocalFileStorageConfig } from './types';

export class LocalFileStorage extends BaseFileStorage {
    #basePath: Path;

    readonly provider = FileStorageProvider.Local;

    constructor(config?: LocalFileStorageConfig) {
        super();
        this.#basePath = Path.resolve(config?.basePath ?? checkAndGetEnvValue('FILE_STORAGE_LOCAL_BASE_PATH'));
        try {
            ensureDirSync(this.#basePath.toString());
        } catch {
            // eslint-disable-next-line style/max-len
            throw new Error(`Failed to initialize storage directory: ${this.#basePath}\nPlease check if the directory exists and has correct permissions`);
        }

        try {
            chmodSync(this.#basePath.toString(), 0o755);
        } catch {
            // eslint-disable-next-line style/max-len
            throw new Error(`Failed to set permissions (755) for storage directory: ${this.#basePath}\nPlease check filesystem permissions for this directory`);
        }
    }

    delete(filePath: PathLike) {
        return this
            .#basePath
            .join(filePath)
            .remove()
            .then(() => this.createResult())
            .catch((error) => this.createResult(new Error(`Delete file failed: ${filePath}, error: ${error}`)));
    }

    exists(filePath: PathLike) {
        return this
            .#basePath
            .join(filePath)
            .access()
            .then(() => this.createResult(true))
            .catch((error) => {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') return this.createResult(false);
                return this.createResult(error);
            });
    }

    async upload(input: BinaryInput, filePath?: PathLike, extension?: string) {
        const buffer = await toBuffer(input);
        const hash = await this.getFileHash(buffer);
        if (!filePath) filePath = this.buildFilePathFromHash(hash, extension);
        filePath = this.#basePath.join(filePath);
        if (!await filePath.parent.ensureDir({ mode: 0o755 }).then(() => true).catch(() => false)) {
            return this.createResult(new Error(`Failed to create directory: ${filePath.parent}`));
        }

        if (!await filePath.writeFile(buffer, { mode: 0o644 }).then(() => true).catch(() => false)) {
            return this.createResult(new Error(`Failed to write file: ${filePath}`));
        }

        return this.createResult({
            hash,
            path: filePath.toString().replace(this.#basePath.toString(), ''),
            provider: this.provider,
        });
    }
}
