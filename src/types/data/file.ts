import type { FileStorageProvider } from '@/constants/file';

export interface FileData extends BaseMongooseModelData<true, false> {
    hash: string;
    path: string;
    provider: FileStorageProvider;
}
