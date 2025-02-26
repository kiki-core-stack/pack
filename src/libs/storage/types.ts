import type { PathLike } from '@kikiutils/classes/path';
import type { Buffer } from 'node:buffer';

export type StorageProviderName = 'local-storage';

export interface LocalStorageProviderConfig {
    basePath: string;
}

export interface StorageProvider {
    deleteFile: (filePath: PathLike) => Promise<void>;
    fileExists: (filePath: PathLike) => Promise<boolean>;
    uploadFile: (filePath: PathLike, buffer: Buffer) => Promise<string>;
}
