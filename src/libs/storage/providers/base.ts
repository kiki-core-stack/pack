import type { PathLike } from '@kikiutils/classes/path';
import { cryptoSHA3256 } from '@kikiutils/node/crypto-hash';
import type { Buffer } from 'node:buffer';

export abstract class AbstractStorageProvider {
    protected generateFilePath(buffer: Buffer, extension?: string) {
        const hash = cryptoSHA3256(buffer);
        if (extension) extension = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
        else extension = '';
        return `/${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash.slice(4, 6)}/${hash}${extension}`;
    }

    abstract deleteFile(filePath: PathLike): Promise<void>;
    abstract fileExists(filePath: PathLike): Promise<boolean>;
    abstract uploadFile(buffer: Buffer, filePath?: PathLike, extension?: string): Promise<string>;
}
