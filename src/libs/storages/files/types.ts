import type { FileStorageProvider } from '../../../constants/file';

export interface LocalFileStorageConfig {
    basePath: string;
}

export interface FileStorageUploadResult {
    hash: string;
    path: string;
    provider: FileStorageProvider;
}
