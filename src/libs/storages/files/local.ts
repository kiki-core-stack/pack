import type { Buffer } from 'node:buffer';
import { access } from 'node:fs/promises';

import { Path } from '@kikiutils/classes/path';
import type { PathLike } from '@kikiutils/classes/path';
import { checkAndGetEnvValue } from '@kikiutils/shared/env';

import { FileStorageProvider } from '../../../constants/file';

import { BaseFileStorage } from './base';
import type { LocalFileStorageConfig } from './types';

export class LocalFileStorage extends BaseFileStorage {
    #basePath: Path;

    readonly provider = FileStorageProvider.Local;

    constructor(config?: LocalFileStorageConfig) {
        super();
        this.#basePath = Path.resolve(config?.basePath ?? checkAndGetEnvValue('FILE_STORAGE_LOCAL_BASE_PATH'));
        if (!this.#basePath.mkdirpSync()) {
            // eslint-disable-next-line style/max-len
            throw new Error(`Failed to initialize storage directory: ${this.#basePath}.\nPlease check if the directory exists and has correct permissions.`);
        }

        if (!this.#basePath.chmodSync(0o755)) {
            // eslint-disable-next-line style/max-len
            throw new Error(`Failed to set permissions (755) for storage directory: ${this.#basePath}.\nPlease check filesystem permissions for this directory.`);
        }
    }

    async delete(filePath: PathLike) {
        if (await this.#basePath.join(filePath).remove()) return this.createResult();
        return this.createResult(new Error(`Delete file failed: "${filePath}".`));
    }

    async exists(filePath: PathLike) {
        try {
            await access(this.#basePath.join(filePath).toString());
            return this.createResult(true);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return this.createResult(false);
            return this.createResult(error as Error);
        }
    }

    async upload(buffer: Buffer, filePath?: PathLike, extension?: string) {
        const hash = this.getFileHash(buffer);
        if (!filePath) filePath = this.buildFilePathFromHash(hash, extension);
        filePath = this.#basePath.join(filePath);
        if (!await filePath.parent.mkdirp({ mode: 0o755 })) {
            return this.createResult(new Error(`Failed to create directory: ${filePath.parent}.`));
        }

        if (!await filePath.writeFile(buffer, { mode: 0o644 })) {
            return this.createResult(new Error(`Failed to write file: ${filePath}.`));
        }

        return this.createResult({
            hash,
            path: filePath.toString().replace(this.#basePath.toString(), ''),
            provider: this.provider,
        });
    }
}
