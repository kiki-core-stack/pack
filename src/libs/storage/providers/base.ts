import type { PathLike } from '@kikiutils/classes/path';
import type { Buffer } from 'node:buffer';

export interface StorageProvider {
    deleteFile: (filePath: PathLike) => Promise<void>;
    uploadFile: (filePath: PathLike, buffer: Buffer) => Promise<string>;
}
