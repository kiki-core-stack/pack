import type {
    Model,
    mongo,
    MongooseUpdateQueryOptions,
    Schema,
    UpdateQuery,
} from 'mongoose';

import * as apiErrors from '../../api-errors';
import { throwApiError } from '../../libs/api/error';

import { registerModelExtensions } from './_internals';

declare module 'mongoose' {
    // eslint-disable-next-line unused-imports/no-unused-vars
    interface Document<T, TQueryHelpers, DocType, TVirtuals, TSchemaOptions> {
        /**
         * Updates the document only if it is unchanged since the client read it, i.e. its `updatedAt` still equals
         * `updatedAt`, throwing `conflict` otherwise (including when it has been deleted).
         *
         * The check and the write are one atomic `updateOne`, so concurrent updates cannot overwrite each other. Every
         * update through mongoose sets a new `updatedAt`, so any change invalidates the client's value.
         */
        assertUpdateIfNotModified: (
            updatedAt: Date | string,
            updateQuery: UpdateQuery<DocType>,
            options?: (mongo.UpdateOptions & MongooseUpdateQueryOptions<DocType>) | null,
        ) => Promise<void>;
    }
}

registerModelExtensions.push((schema: Schema) => {
    schema.method(
        'assertUpdateIfNotModified',
        async function (
            updatedAt: Date | string,
            updateQuery: UpdateQuery<unknown>,
            options?: (mongo.UpdateOptions & MongooseUpdateQueryOptions<unknown>) | null,
        ) {
            const updateResult = await (this.constructor as Model<unknown>).updateOne(
                {
                    _id: this._id,
                    updatedAt: new Date(updatedAt),
                },
                updateQuery,
                options,
            );

            if (!updateResult.acknowledged) throw new Error('Update was not acknowledged');
            if (updateResult.matchedCount !== 1) throwApiError(apiErrors.common.conflict);
        },
    );
});
