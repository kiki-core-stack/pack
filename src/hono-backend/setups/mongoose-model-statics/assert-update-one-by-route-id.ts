import type { BaseMongoosePaginateModel } from '@kikiutils/mongoose/types';
import type { Context } from 'hono';
import type {
    mongo,
    MongooseUpdateQueryOptions,
    QueryFilter,
    Schema,
    UpdateQuery,
} from 'mongoose';

import * as apiErrors from '../../api-errors';
import { throwApiError } from '../../libs/api/error';

import { registerStaticFunctions } from './_internals';

declare module '@kikiutils/mongoose/types' {
    // eslint-disable-next-line unused-imports/no-unused-vars
    interface BaseMongooseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
        assertUpdateOneByRouteId: (
            ctx: Context,
            updateQuery: UpdateQuery<RawDocType>,
            options?: (mongo.UpdateOptions & MongooseUpdateQueryOptions<RawDocType>) | null,
            filter?: QueryFilter<RawDocType>,
            expectedModifiedCount?: number,
        ) => Promise<void>;
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
            'assertUpdateOneByRouteId',
            async function (
                ctx: Context,
                updateQuery: UpdateQuery<DocType>,
                options?: (mongo.UpdateOptions & MongooseUpdateQueryOptions<DocType>) | null,
                filter?: QueryFilter<DocType>,
                expectedModifiedCount: number = 1,
            ) {
                const id = ctx.req.param('id');
                if (!id) throwApiError(apiErrors.common.notFound);
                const updateResult = await this.updateOne(
                    {
                        ...filter || {},
                        _id: id,
                    },
                    updateQuery,
                    options,
                );

                if (!updateResult.acknowledged) throw new Error('Update was not acknowledged');
                if (updateResult.matchedCount !== 1) throwApiError(apiErrors.common.notFound);
                if (updateResult.modifiedCount < expectedModifiedCount) {
                    throw new Error(`Expected to modify at least ${expectedModifiedCount} document(s), but modified ${updateResult.modifiedCount}`);
                }
            },
        );
    },
);
