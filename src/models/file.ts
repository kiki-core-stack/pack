import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { getEnumNumberValues } from '@kikiutils/shared/enum';
import {
    Document,
    Schema,
    Types,
} from 'mongoose';
import type {
    ProjectionFields,
    Query,
} from 'mongoose';

import { FileStorageProvider } from '@/constants/file';
import { schemaTimestampsConfigOnlyCreatedAt } from '@/constants/mongoose';
import * as enhancedRedisStore from '@/stores/enhanced/redis';
import * as lruStore from '@/stores/lru';
import type { FileData } from '@/types/data/file';

export type File = SmartDataToBaseMongooseDocType<FileData>;
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

function isEligibleIdQuery(query: Query<any, any>, mode: 'in' | 'single') {
    const filter = query.getFilter();
    if (Object.keys(filter).length !== 1 || !filter._id) return false;
    if (mode === 'single') return typeof filter._id === 'string' || filter._id instanceof Types.ObjectId;
    return (
        typeof filter._id === 'object'
        && Object.keys(filter._id).length === 1
        && Array.isArray(filter._id.$in)
    );
}

function serializeProjection(projection?: ProjectionFields<any>) {
    if (!projection || !Object.keys(projection).length) return;
    return Object.entries(projection).map(([key, value]) => `${key}:${value}`).sort().join(',');
}

// find
schema.post(
    'find',
    async function (result) {
        if (this._mongooseOptions.isFromCache) return;
        if (!isEligibleIdQuery(this, 'in')) return;

        const projectionKey = serializeProjection(this.projection());

        await Promise.all(
            result.map(async (value: any) => {
                if (!(value instanceof Document)) return;
                const fileDocumentData = value.toObject();
                const id = value._id.toHexString();
                lruStore.fileDocumentData.setItem(fileDocumentData, id, projectionKey);
                await enhancedRedisStore.fileDocumentData.setItemWithTtl(3600, fileDocumentData, id, projectionKey);
            }),
        );
    },
);

schema.pre(
    'find',
    async function () {
        const filter = this.getFilter();
        if (!isEligibleIdQuery(this, 'in')) return;

        const projectionKey = serializeProjection(this.projection());

        const ids = (filter._id.$in as (string | Types.ObjectId)[]).map((id) => {
            if (id instanceof Types.ObjectId) return id.toHexString();
            return id;
        });

        const allFileDocumentData = await Promise.all(
            ids.map((id) => {
                return (
                    lruStore.fileDocumentData.getItem(id, projectionKey)
                    || enhancedRedisStore.fileDocumentData.getItem(id, projectionKey)
                );
            }),
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
        if (!(result instanceof Document)) return;
        if (!isEligibleIdQuery(this, 'single')) return;

        const projectionKey = serializeProjection(this.projection());

        const fileDocumentData = result.toObject();
        const id = result._id.toHexString();
        lruStore.fileDocumentData.setItem(fileDocumentData, id, projectionKey);
        await enhancedRedisStore.fileDocumentData.setItemWithTtl(3600, fileDocumentData, id, projectionKey);
    },
);

schema.pre(
    'findOne',
    async function () {
        const filter = this.getFilter();
        if (!isEligibleIdQuery(this, 'single')) return;

        const projectionKey = serializeProjection(this.projection());

        const id = filter._id;
        let fileDocumentData = lruStore.fileDocumentData.getItem(id, projectionKey);
        if (!fileDocumentData) fileDocumentData = await enhancedRedisStore.fileDocumentData.getItem(id, projectionKey);
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
