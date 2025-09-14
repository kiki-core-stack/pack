import type { FileStorageProvider } from '@/constants/file';

export interface FileStorageUploadResult {
    hash: string;
    path: string;
    provider: FileStorageProvider;
}

export interface LocalFileStorageConfig {
    basePath: string;
}
