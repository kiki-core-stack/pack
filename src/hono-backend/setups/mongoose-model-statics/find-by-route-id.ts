import type {
    BaseMongoosePaginateModel,
    MongooseFindOneReturnType,
} from '@kikiutils/mongoose/types';
import type { Context } from 'hono';
import type {
    HydratedDocument,
    ProjectionType,
    QueryOptions,
    Schema,
} from 'mongoose';

import { registerStaticFunctions } from './_internals';

declare module '@kikiutils/mongoose/types' {
    interface BaseMongooseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
        findByRouteId: (
            ctx: Context,
            projection?: null | ProjectionType<RawDocType>,
            options?: null | QueryOptions<RawDocType>,
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
                projection?: null | ProjectionType<DocType>,
                options?: null | QueryOptions<DocType>,
            ) {
                return this.findById(ctx.req.param('id'), projection, options);
            },
        );
    },
);
