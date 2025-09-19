import type {
    BaseMongoosePaginateModel,
    MongooseFindOneReturnType,
} from '@kikiutils/mongoose/types';
import type { Nullable } from '@kikiutils/types';
import type { Context } from 'hono';
import type {
    HydratedDocument,
    ProjectionType,
    QueryOptions,
    Schema,
} from 'mongoose';

import { registerStaticFunctions } from './_internals';

declare module '@kikiutils/mongoose/types' {
    interface BaseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
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
    }
}

registerStaticFunctions.push(
    <
        DocType,
        Model extends BaseMongoosePaginateModel<DocType, InstanceMethodsAndOverrides, QueryHelpers>,
        InstanceMethodsAndOverrides = object,
        QueryHelpers = object,
    >(schema: Schema<DocType, Model, InstanceMethodsAndOverrides, QueryHelpers>) => {
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
    },
);
