import type { BaseMongoosePaginateModel } from '@kikiutils/mongoose/types';
import type { Nullable } from '@kikiutils/shared/types';
import type { Context } from 'hono';
import { Types } from 'mongoose';
import type {
    HydratedDocument,
    ProjectionType,
    QueryFilter,
    QueryOptions,
    Schema,
} from 'mongoose';

import { throwApiError } from '../../libs/api';

import { registerStaticFunctions } from './_internals';

declare module '@kikiutils/mongoose/types' {
    interface BaseMongooseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
        findByRouteIdOrThrowNotFoundError: (
            ctx: Context,
            filter?: QueryFilter<RawDocType>,
            projection?: Nullable<ProjectionType<RawDocType>>,
            options?: Nullable<QueryOptions<RawDocType>>,
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
                filter?: QueryFilter<DocType>,
                projection?: Nullable<ProjectionType<DocType>>,
                options?: Nullable<QueryOptions<DocType>>,
            ) {
                const id = ctx.req.param('id');
                if (!id) throwApiError(404);
                if (!Types.ObjectId.isValid(id)) throwApiError(400);
                const document = await this.findOne(
                    // @ts-expect-error Ignore this error.
                    {
                        ...filter,
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
