import { setCustomMongooseOptions } from '@kikiutils/mongoose/options';
import type { Context } from 'hono';
import { Types } from 'mongoose';
import type {
    HydratedDocument,
    mongo,
    MongooseUpdateQueryOptions,
    ProjectionType,
    QueryOptions,
    RootFilterQuery,
    Schema,
    UpdateQuery,
} from 'mongoose';

import { defaultApiErrors } from '../constants/api';

declare module '@kikiutils/mongoose/types' {
    interface BaseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
        assertUpdateOneByRouteId: (
            ctx: Context,
            updateQuery: UpdateQuery<RawDocType>,
            options?: Nullable<(mongo.UpdateOptions & MongooseUpdateQueryOptions<RawDocType>)>,
            filter?: RootFilterQuery<RawDocType>,
            expectedModifiedCount?: number
        ) => Promise<void>;

        findByRouteId: (
            ctx: Context,
            projection?: Nullable<ProjectionType<RawDocType>>,
            options?: Nullable<QueryOptions<RawDocType>>
        ) => MongooseFindOneReturnType<
            RawDocType,
            HydratedDocument<RawDocType, InstanceMethodsAndOverrides, QueryHelpers>,
            QueryHelpers,
            InstanceMethodsAndOverrides
        >;

        findByRouteIdOrThrowNotFoundError: (
            ctx: Context,
            filter?: RootFilterQuery<RawDocType>,
            projection?: Nullable<ProjectionType<RawDocType>>,
            options?: Nullable<QueryOptions<RawDocType>>
        ) => Promise<HydratedDocument<RawDocType, InstanceMethodsAndOverrides, QueryHelpers>>;
    }
}

setCustomMongooseOptions(
    'beforeModelBuild',
    <
        DocType,
        Model extends BaseMongoosePaginateModel<DocType, InstanceMethodsAndOverrides, QueryHelpers>,
        InstanceMethodsAndOverrides = object,
        QueryHelpers = object,
    >(schema: Schema<DocType, Model, InstanceMethodsAndOverrides, QueryHelpers>) => {
        schema.static(
            'assertUpdateOneByRouteId',
            async function (
                ctx: Context,
                updateQuery: UpdateQuery<DocType>,
                options?: Nullable<(mongo.UpdateOptions & MongooseUpdateQueryOptions<DocType>)>,
                filter?: RootFilterQuery<DocType>,
                expectedModifiedCount: number = 1,
            ) {
                const id = ctx.req.param('id');
                if (!id) throw defaultApiErrors.notFound;
                const updateResult = await this.updateOne(
                    {
                        ...filter,
                        _id: id,
                    },
                    updateQuery,
                    options,
                );

                if (!updateResult.acknowledged) throw new Error('Update was not acknowledged.');
                if (updateResult.matchedCount !== 1) throw defaultApiErrors.notFound;
                if (updateResult.modifiedCount < expectedModifiedCount) {
                    // eslint-disable-next-line style/max-len
                    throw new Error(`Expected to modify at least ${expectedModifiedCount} document(s), but modified ${updateResult.modifiedCount}.`);
                }
            },
        );

        schema.static(
            'findByRouteId',
            function (
                ctx: Context,
                projection?: Nullable<ProjectionType<DocType>>,
                options?: Nullable<QueryOptions<DocType>>,
            ) {
                return this.findById(ctx.req.param('id'), projection, options);
            },
        );

        schema.static(
            'findByRouteIdOrThrowNotFoundError',
            async function (
                ctx: Context,
                filter?: RootFilterQuery<DocType>,
                projection?: Nullable<ProjectionType<DocType>>,
                options?: Nullable<QueryOptions<DocType>>,
            ) {
                const id = ctx.req.param('id');
                if (!id) throw defaultApiErrors.notFound;
                if (!Types.ObjectId.isValid(id)) throw defaultApiErrors.badRequest;
                const document = await this.findOne(
                    {
                        ...filter,
                        _id: id,
                    },
                    projection,
                    options,
                );

                if (!document) throw defaultApiErrors.notFound;
                return document;
            },
        );
    },
);
