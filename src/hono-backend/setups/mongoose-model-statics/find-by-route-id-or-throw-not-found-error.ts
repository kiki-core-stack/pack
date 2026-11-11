import type { BaseMongoosePaginateModel } from '@kikiutils/mongoose/types';
import type { Context } from 'hono';
import { Types } from 'mongoose';
import type {
    HydratedDocument,
    ProjectionType,
    QueryFilter,
    QueryOptions,
    Schema,
} from 'mongoose';

import * as apiErrors from '../../api-errors';
import { throwApiError } from '../../libs/api/error';

import { registerStaticFunctions } from './_internals';

declare module '@kikiutils/mongoose/types' {
    interface BaseMongooseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
        findByRouteIdOrThrowNotFoundError: (
            ctx: Context,
            filter?: QueryFilter<RawDocType>,
            projection?: null | ProjectionType<RawDocType>,
            options?: null | QueryOptions<RawDocType>,
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
                projection?: null | ProjectionType<DocType>,
                options?: null | QueryOptions<DocType>,
            ) {
                const id = ctx.req.param('id');
                if (!id) throwApiError(apiErrors.common.notFound);
                if (!Types.ObjectId.isValid(id)) throwApiError(apiErrors.common.notFound);
                const document = await this.findOne(
                    {
                        ...filter || {},
                        _id: id,
                    },
                    projection,
                    options,
                );

                if (!document) throwApiError(apiErrors.common.notFound);
                return document;
            },
        );
    },
);
