import * as s from '@kikiutils/mongoose/schema-builders';
import { getEnumNumberValues } from '@kikiutils/node/enum';
import { Schema } from 'mongoose';

import { FileStorageProvider } from '@/constants/file';
import { schemaTimestampsConfigOnlyCreatedAt } from '@/constants/mongoose';

import type {
    File,
    FileModel,
} from './types';

export const fileSchema = new Schema<File, FileModel>(
    {
        hash: s.string().trim.unique.required,
        path: s.string().trim.required,
        provider: s.number().enum(getEnumNumberValues(FileStorageProvider)).required,
    },
    { timestamps: schemaTimestampsConfigOnlyCreatedAt },
);
