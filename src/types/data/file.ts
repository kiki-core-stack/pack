import type { FileStorageProvider } from '../../constants/file';

export type BaseFileData = Pick<FileData, 'id' | 'path' | 'provider'>;

export interface FileData extends BaseMongooseModelData<true, false> {
    hash: string;
    path: string;
    provider: FileStorageProvider;
}
