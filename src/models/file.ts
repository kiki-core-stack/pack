import * as s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import { Schema } from 'mongoose';

import { FileStorageProvider } from '../constants/file';
import { schemaTimestampsConfigOnlyCreatedAt } from '../constants/mongoose';
import * as enhancedRedisStore from '../stores/enhanced/redis';
import * as lruStore from '../stores/lru';
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

schema.post(
    'findOne',
    async function (result) {
        if (this._mongooseOptions.isFromCache) return;

        const filter = this.getFilter();
        if (Object.keys(filter).length !== 1 || !filter._id) return;
        const projection = this.projection();
        if (projection && Object.keys(projection).length) return;

        const id = filter._id;
        lruStore.fileDocumentData.setItem(result.toObject(), id);
        await enhancedRedisStore.fileDocumentData.setItemWithTtl(3600, result.toObject(), id);
    },
);

schema.pre(
    'findOne',
    async function () {
        const filter = this.getFilter();
        if (Object.keys(filter).length !== 1 || !filter._id) return;
        const projection = this.projection();
        if (projection && Object.keys(projection).length) return;

        const id = filter._id;
        let fileDocumentData = lruStore.fileDocumentData.getItem(id);
        if (!fileDocumentData) fileDocumentData = await enhancedRedisStore.fileDocumentData.getItem(id);
        if (fileDocumentData) {
            this._mongooseOptions.isFromCache = true;
            (this as any)._findOne = function () {
                // eslint-disable-next-line new-cap
                return new this.model(fileDocumentData);
            };
        }
    },
);

export const FileModel = buildMongooseModel<File, FileModel>('file.files', 'File', schema);
