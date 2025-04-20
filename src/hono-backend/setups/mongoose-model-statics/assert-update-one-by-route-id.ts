import type { Context } from 'hono';
import type {
    mongo,
    MongooseUpdateQueryOptions,
    RootFilterQuery,
    Schema,
    UpdateQuery,
} from 'mongoose';

import { defaultApiErrors } from '../../constants/api';

import { registerStaticFunctions } from './_internals';

declare module '@kikiutils/mongoose/types' {
    // eslint-disable-next-line unused-imports/no-unused-vars
    interface BaseModelStatics<RawDocType, InstanceMethodsAndOverrides = object, QueryHelpers = object> {
        assertUpdateOneByRouteId: (
            ctx: Context,
            updateQuery: UpdateQuery<RawDocType>,
            options?: Nullable<(mongo.UpdateOptions & MongooseUpdateQueryOptions<RawDocType>)>,
            filter?: RootFilterQuery<RawDocType>,
            expectedModifiedCount?: number
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
    },
);
