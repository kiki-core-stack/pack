import {
    chmodSync,
    mkdirSync,
} from 'node:fs';

import { toBuffer } from '@kikiutils/shared/buffer';
import { Path } from '@kikiutils/shared/classes/path';
import type { PathLike } from '@kikiutils/shared/classes/path';
import { checkAndGetEnvValue } from '@kikiutils/shared/env';
import type { BinaryInput } from '@kikiutils/shared/types';

import { FileStorageProvider } from '../../../constants/file';

import { BaseFileStorage } from './base';
import type { LocalFileStorageConfig } from './types';

export class LocalFileStorage extends BaseFileStorage {
    #basePath: Path;

    readonly provider = FileStorageProvider.Local;

    constructor(config?: LocalFileStorageConfig) {
        super();
        this.#basePath = Path.resolve(config?.basePath ?? checkAndGetEnvValue('FILE_STORAGE_LOCAL_BASE_PATH'));
        try {
            mkdirSync(this.#basePath.toString(), { recursive: true });
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

    // Private methods
    async #chmodPublicDirectoryPath(directoryPath: Path) {
        const relativeDirectoryPath = this.#basePath.relative(directoryPath).toString();
        const directoryParts = relativeDirectoryPath
            .split(/[\\/]+/)
            .filter((directoryPart) => directoryPart && directoryPart !== '.');

        let currentDirectoryPath = this.#basePath;
        for (const directoryPart of directoryParts) {
            currentDirectoryPath = Path.resolve(currentDirectoryPath, directoryPart);
            if (!await currentDirectoryPath.chmod(0o755).then(() => true).catch(() => false)) return false;
        }

        return true;
    }

    #resolveStoragePath(filePath: PathLike) {
        const relativeFilePath = filePath.toString().replace(/^[\\/]+/, '');
        if (!relativeFilePath) throw new Error('Invalid empty storage path');

        const resolvedFilePath = Path.resolve(this.#basePath, relativeFilePath);
        const relativeResolvedFilePath = this.#basePath.relative(resolvedFilePath);
        const relativeResolvedFilePathString = relativeResolvedFilePath.toString();
        if (
            relativeResolvedFilePathString === '..'
            || relativeResolvedFilePathString.startsWith('../')
            || relativeResolvedFilePathString.startsWith('..\\')
            || relativeResolvedFilePath.isAbsolute()
        ) throw new Error(`Invalid storage path outside base directory: ${filePath}`);

        return resolvedFilePath;
    }

    // Public methods
    delete(filePath: PathLike) {
        return Promise.resolve()
            .then(() => this.#resolveStoragePath(filePath))
            .then((resolvedFilePath) => resolvedFilePath.rm({ force: true }))
            .then(() => this.createResult())
            .catch((error) => this.createResult(new Error(`Delete file failed: ${filePath}, error: ${error}`)));
    }

    exists(filePath: PathLike) {
        return Promise.resolve()
            .then(() => this.#resolveStoragePath(filePath))
            .then((resolvedFilePath) => resolvedFilePath.access())
            .then(() => this.createResult(true))
            .catch((error) => {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') return this.createResult(false);
                return this.createResult(error);
            });
    }

    read(filePath: PathLike) {
        return Promise.resolve()
            .then(() => this.#resolveStoragePath(filePath))
            .then((resolvedFilePath) => resolvedFilePath.readFile())
            .then((buffer) => this.createResult(buffer))
            .catch((error) => this.createResult(new Error(`Read file failed: ${filePath}, error: ${error}`)));
    }

    async upload(input: BinaryInput, filePath?: PathLike, extension?: string) {
        const buffer = await toBuffer(input);
        const hash = await this.getFileHash(buffer);
        if (filePath === undefined) filePath = this.buildFilePathFromHash(hash, extension);
        try {
            filePath = this.#resolveStoragePath(filePath);
        } catch (error) {
            return this.createResult(error instanceof Error ? error : new Error(String(error)));
        }

        if (!await filePath.parent.mkdir({ recursive: true }).then(() => true).catch(() => false)) {
            return this.createResult(new Error(`Failed to create directory: ${filePath.parent}`));
        }

        if (!await this.#chmodPublicDirectoryPath(filePath.parent)) {
            return this.createResult(
                new Error(`Failed to set permissions (755) for directory path: ${filePath.parent}`),
            );
        }

        if (!await filePath.writeFile(buffer).then(() => true).catch(() => false)) {
            return this.createResult(new Error(`Failed to write file: ${filePath}`));
        }

        if (!await filePath.chmod(0o644).then(() => true).catch(() => false)) {
            return this.createResult(new Error(`Failed to set permissions (644) for file: ${filePath}`));
        }

        return this.createResult({
            hash,
            path: filePath.toString().replace(this.#basePath.toString(), ''),
            provider: this.provider,
        });
    }
}
