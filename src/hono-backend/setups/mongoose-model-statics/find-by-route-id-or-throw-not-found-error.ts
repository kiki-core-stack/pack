import type { Context } from 'hono';
import { Types } from 'mongoose';
import type {
    HydratedDocument,

    ProjectionType,
    QueryOptions,
    RootFilterQuery,
    Schema,

} from 'mongoose';

import { defaultApiErrors } from '../../constants/api';

import { registerStaticFunctions } from './_internals';

declare module '@kikiutils/mongoose/types' {
    interface BaseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
        findByRouteIdOrThrowNotFoundError: (
            ctx: Context,
            filter?: RootFilterQuery<RawDocType>,
            projection?: Nullable<ProjectionType<RawDocType>>,
            options?: Nullable<QueryOptions<RawDocType>>
        ) => Promise<HydratedDocument<RawDocType, InstanceMethodsAndOverrides, QueryHelpers>>;
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
