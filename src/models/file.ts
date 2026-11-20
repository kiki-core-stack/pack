import { buildMongooseModel } from '@kikiutils/mongoose/builders';
import * as s from '@kikiutils/mongoose/schema-builders';
import type {
    BaseMongoosePaginateModel,
    MongooseHydratedDocument,
} from '@kikiutils/mongoose/types';
import { isPlainObject } from 'es-toolkit';
import {
    Schema,
    Types,
} from 'mongoose';
import type {
    ProjectionFields,
    Query,
} from 'mongoose';
import {
    objectEntries,
    objectKeys,
} from 'ts-extras';

import * as lruStore from '../stores/lru';
import type { SmartDataToBaseMongooseDocType } from '../types/data';
import type { FileData } from '../types/data/file';

export type File = SmartDataToBaseMongooseDocType<FileData>;
export type FileDocument = MongooseHydratedDocument<File>;
type FileModel = BaseMongoosePaginateModel<File>;
type FileQuery = Query<FileDocument | FileDocument[] | null, File>;

const schema = new Schema<File, FileModel>(
    {
        extension: s.string().trim.nonRequired,
        hash: s.string().trim.unique.required,
        image: {
            _id: false,
            required: false,
            type: {
                height: s.int32().min(1).required,
                width: s.int32().min(1).required,
            },
        },
        mimeType: s.string().trim.required,
        size: s.number().min(0).required,
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    },
);

const cacheHitQueries = new WeakSet<FileQuery>();

// Functions

/**
 * 只快取單純以 _id（findOne）或 _id.$in（find）查詢的非 lean 查詢；projection 排除 _id 時不快取。
 */
function getCacheableFileIds(query: FileQuery, op: 'find' | 'findOne') {
    if (query.mongooseOptions().lean) return;
    const projection = query.projection();
    if (projection?._id === 0 || projection?._id === false) return;
    const filter = query.getFilter();
    if (objectKeys(filter).length !== 1) return;
    let ids: unknown[];
    if (op === 'findOne') ids = [filter._id];
    else if (isPlainObject(filter._id) && objectKeys(filter._id).length === 1 && Array.isArray(filter._id.$in)) {
        ids = filter._id.$in;
    } else return;

    if (!ids.length || !ids.every((id) => typeof id === 'string' || id instanceof Types.ObjectId)) return;
    return [...new Set(ids.map(String))];
}

function serializeProjection(projection: null | ProjectionFields<File> | undefined) {
    if (!projection) return '';
    return objectEntries(projection).map(([key, value]) => `${key}:${value}`).sort().join(',');
}

/**
 * File 文件不可變，因此以本機 LRU 快取，不需要失效機制。
 * Mongoose 沒有讓 query pre hook 回傳結果的公開 API（skipMiddlewareFunction 不適用於 query hook），
 * 命中時改寫內部的 _find／_findOne 略過查詢；已於 Mongoose 9.12.1 驗證，升級時需重新確認。
 */
for (const op of [
    'find',
    'findOne',
] as const) {
    schema.pre<FileQuery>(
        op,
        function () {
            const ids = getCacheableFileIds(this, op);
            if (!ids) return;
            const projection = this.projection();
            const projectionKey = serializeProjection(projection);
            const allFileData = ids.map((id) => lruStore.file.document.getItem(id, projectionKey));
            if (allFileData.some((fileData) => !fileData)) return;
            // Mongo returns _id unless excluded (such queries are not cached); hydrate drops fields outside an
            // inclusive projection, so keep _id explicitly for populate to match the documents.
            const hydrateProjection = projection && {
                ...projection,
                _id: 1,
            };

            const files = allFileData.map((fileData) => this.model.hydrate(fileData, hydrateProjection));
            cacheHitQueries.add(this);
            (this as any)[`_${op}`] = async () => op === 'find' ? files : files[0];
        },
    );

    schema.post<FileQuery>(
        op,
        function (result: FileDocument | FileDocument[] | null) {
            if (!result || cacheHitQueries.has(this) || !getCacheableFileIds(this, op)) return;
            const projectionKey = serializeProjection(this.projection());
            for (const file of Array.isArray(result) ? result : [result]) {
                lruStore.file.document.setItem(file.toObject(), file._id.toHexString(), projectionKey);
            }
        },
    );
}

export const FileModel = buildMongooseModel<File, FileModel>('file.files', 'File', schema);
