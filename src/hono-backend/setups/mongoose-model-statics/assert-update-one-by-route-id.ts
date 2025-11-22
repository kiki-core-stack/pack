import type { BaseMongoosePaginateModel } from '@kikiutils/mongoose/types';
import type { Nullable } from '@kikiutils/shared/types';
import type { Context } from 'hono';
import type {
    mongo,
    MongooseUpdateQueryOptions,
    QueryFilter,
    Schema,
    UpdateQuery,
} from 'mongoose';

import { throwApiError } from '../../libs/api';

import { registerStaticFunctions } from './_internals';

declare module '@kikiutils/mongoose/types' {
    // eslint-disable-next-line unused-imports/no-unused-vars
    interface BaseMongooseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
        assertUpdateOneByRouteId: (
            ctx: Context,
            updateQuery: UpdateQuery<RawDocType>,
            options?: Nullable<(mongo.UpdateOptions & MongooseUpdateQueryOptions<RawDocType>)>,
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
                options?: Nullable<(mongo.UpdateOptions & MongooseUpdateQueryOptions<DocType>)>,
                filter?: QueryFilter<DocType>,
                expectedModifiedCount: number = 1,
            ) {
                const id = ctx.req.param('id');
                if (!id) throwApiError(404);
                const updateResult = await this.updateOne(
                    // @ts-expect-error Ignore this error.
                    {
                        ...filter,
                        _id: id,
                    },
                    updateQuery,
                    options,
                );

                if (!updateResult.acknowledged) throw new Error('Update was not acknowledged');
                if (updateResult.matchedCount !== 1) throwApiError(404);
                if (updateResult.modifiedCount < expectedModifiedCount) {
                    // eslint-disable-next-line style/max-len
                    throw new Error(`Expected to modify at least ${expectedModifiedCount} document(s), but modified ${updateResult.modifiedCount}`);
                }
            },
        );
    },
);
