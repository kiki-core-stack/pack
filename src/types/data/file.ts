import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

export type BaseFileData = Pick<FileData, 'extension' | 'hash'>;

export interface FileData extends BaseMongooseModelData<true, false> {
    /**
     * Without the leading dot; absent when the type cannot be detected from the content.
     */
    extension?: string;

    /**
     * SHA-256 of the content (hex); also the public storage key, see `getPublicFileKey`.
     */
    hash: string;
    image?: FileImageData;
    mimeType: string;
    size: number;
}

export interface FileImageData {
    height: number;
    width: number;
}
