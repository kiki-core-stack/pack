import type { FileStorageProvider } from '@/constants/file';

export type Result<T = undefined> =
  | (T extends undefined ? unknown : { value: T }) & { ok: true }
  | { error: unknown; ok: false };

export interface LocalFileStorageConfig {
    basePath: string;
}

export interface FileStorageUploadResult {
    hash: string;
    path: string;
    provider: FileStorageProvider;
}
