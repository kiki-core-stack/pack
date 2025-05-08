import type { Buffer } from 'node:buffer';

import type { PathLike } from '@kikiutils/classes/path';
import { cryptoSha3256 } from '@kikiutils/shared/crypto-hash';

import type { FileStorageProvider } from '../../../constants/file';

import type { FileStorageUploadResult } from './types';

type Result<T = undefined> =
  | (T extends undefined ? unknown : { value: T }) & { ok: true }
  | { error: unknown; ok: false };

export abstract class BaseFileStorage {
    abstract readonly provider: FileStorageProvider;

    protected buildFilePathFromHash(hash: string, extension?: string) {
        if (extension) extension = extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
        else extension = '';
        return `/${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash.slice(4, 6)}/${hash}${extension}`;
    }

    protected createResult(): Result;
    protected createResult<E extends Error>(error: E): { error: E; ok: false };
    protected createResult<T>(value: T): Result<T>;
    protected createResult(errorOrValue?: any) {
        if (errorOrValue === undefined) return { ok: true } as const;
        if (errorOrValue instanceof Error) {
            return {
                error: errorOrValue,
                ok: false,
            };
        }

        return {
            ok: true,
            value: errorOrValue,
        } as const;
    }

    protected getFileHash(buffer: Buffer) {
        return cryptoSha3256(buffer);
    }

    abstract delete(filePath: PathLike): Promise<Result>;
    abstract exists(filePath: PathLike): Promise<Result<boolean>>;
    abstract upload(buffer: Buffer, filePath?: PathLike, extension?: string): Promise<Result<FileStorageUploadResult>>;
}
