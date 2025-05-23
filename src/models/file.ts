import * as s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import {
    Schema,
    Types,
} from 'mongoose';
import type { Query } from 'mongoose';

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

function isEligibleIdQueryWithoutProjection(query: Query<any, any>, mode: 'in' | 'single') {
    const filter = query.getFilter();
    if (Object.keys(filter).length !== 1 || !filter._id) return false;
    const projection = query.projection();
    if (projection && Object.keys(projection).length > 0) return false;

    if (mode === 'single') return typeof filter._id === 'string' || filter._id instanceof Types.ObjectId;
    return (
        typeof filter._id === 'object'
        && Object.keys(filter._id).length === 1
        && Array.isArray(filter._id.$in)
    );
}

// find
schema.post(
    'find',
    async function (result) {
        if (this._mongooseOptions.isFromCache) return;
        if (!isEligibleIdQueryWithoutProjection(this, 'in')) return;

        await Promise.all(
            result.map(async (document: any) => {
                const fileDocumentData = document.toObject();
                const id = document._id.toHexString();
                lruStore.fileDocumentData.setItem(fileDocumentData, id);
                await enhancedRedisStore.fileDocumentData.setItemWithTtl(3600, fileDocumentData, id);
            }),
        );
    },
);

schema.pre(
    'find',
    async function () {
        const filter = this.getFilter();
        if (!isEligibleIdQueryWithoutProjection(this, 'in')) return;

        const ids = (filter._id.$in as (string | Types.ObjectId)[]).map((id) => {
            if (id instanceof Types.ObjectId) return id.toHexString();
            return id;
        });

        const allFileDocumentData = await Promise.all(
            ids.map((id) => lruStore.fileDocumentData.getItem(id) || enhancedRedisStore.fileDocumentData.getItem(id)),
        );

        if (!allFileDocumentData.includes(null)) {
            this._mongooseOptions.isFromCache = true;
            const model = this.model;
            (this as any)._find = function () {
                // eslint-disable-next-line new-cap
                return allFileDocumentData.map((fileDocumentData) => new model(fileDocumentData));
            };
        }
    },
);

// fineOne
schema.post(
    'findOne',
    async function (result) {
        if (!result) return;
        if (!isEligibleIdQueryWithoutProjection(this, 'single')) return;

        const fileDocumentData = result.toObject();
        const id = result._id.toHexString();
        lruStore.fileDocumentData.setItem(fileDocumentData, id);
        await enhancedRedisStore.fileDocumentData.setItemWithTtl(3600, fileDocumentData, id);
    },
);

schema.pre(
    'findOne',
    async function () {
        const filter = this.getFilter();
        if (!isEligibleIdQueryWithoutProjection(this, 'single')) return;

        const id = filter._id;
        let fileDocumentData = lruStore.fileDocumentData.getItem(id);
        if (!fileDocumentData) fileDocumentData = await enhancedRedisStore.fileDocumentData.getItem(id);
        if (fileDocumentData) {
            this._mongooseOptions.isFromCache = true;
            const model = this.model;
            (this as any)._findOne = function () {
                // eslint-disable-next-line new-cap
                return new model(fileDocumentData);
            };
        }
    },
);

export const FileModel = buildMongooseModel<File, FileModel>('file.files', 'File', schema);
