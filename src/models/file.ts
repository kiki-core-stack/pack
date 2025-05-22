import * as s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { FileStorageProvider } from '../constants/file';
import { schemaTimestampsConfigOnlyCreatedAt } from '../constants/mongoose';
import type { FileData } from '../types/data/file';

export type File = BaseMongooseDocType<FileData, true, false>;
export type FileDocument = MongooseHydratedDocument<File>;
type FileModel = BaseMongoosePaginateModel<File>;

const schema = new Schema<File, FileModel>(
    {
        hash: s.string().trim.unique.required,
        path: s.string().trim.required,
        provider: s.number().enum(getEnumNumberValues(FileStorageProvider)).required,
    },
    { timestamps: schemaTimestampsConfigOnlyCreatedAt },
);

export const FileModel = buildMongooseModel<File, FileModel>('file.files', 'File', schema);
