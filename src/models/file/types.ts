import type { FileData } from '../../types/data/file';

export type File = BaseMongooseDocType<FileData, true, false>;
export type FileDocument = MongooseHydratedDocument<File>;
export type FileModel = BaseMongoosePaginateModel<File>;
