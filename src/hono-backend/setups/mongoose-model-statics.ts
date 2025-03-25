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

declare module '@kikiutils/mongoose/types' {
    interface BaseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
        assertUpdateOneByRouteId: (
            ctx: Context,
            updateQuery: UpdateQuery<RawDocType>,
            options?: Nullable<(mongo.UpdateOptions & MongooseUpdateQueryOptions<RawDocType>)>,
            filterQuery?: RootFilterQuery<RawDocType>,
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
            filterQuery?: RootFilterQuery<RawDocType>,
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
                filterQuery?: RootFilterQuery<DocType>,
                expectedModifiedCount: number = 1,
            ) {
                const id = ctx.req.param('id');
                if (!id) throwApiError(404);
                const updateResult = await this.updateOne(
                    {
                        ...filterQuery,
                        _id: id,
                    },
                    updateQuery,
                    options,
                );

                if (!updateResult.acknowledged) throw new Error('Update was not acknowledged.');
                if (updateResult.matchedCount !== 1) throwApiError(404);
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
                filterQuery?: RootFilterQuery<DocType>,
                projection?: Nullable<ProjectionType<DocType>>,
                options?: Nullable<QueryOptions<DocType>>,
            ) {
                const id = ctx.req.param('id');
                if (!id) throwApiError(404);
                if (!Types.ObjectId.isValid(id)) throwApiError(400);
                const document = await this.findOne(
                    {
                        ...filterQuery,
                        _id: id,
                    },
                    projection,
                    options,
                );

                if (!document) throwApiError(404);
                return document;
            },
        );
    },
);
