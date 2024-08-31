import type { BuildMongooseModelOptions } from '@kikiutils/mongoose/types/options';
import { buildMongooseModel as _buildMongooseModel } from '@kikiutils/mongoose/utils';
import { getRouterParam } from 'h3';
import type { H3Event } from 'h3';
import type { ProjectionType, QueryOptions, Schema } from 'mongoose';

import ApiError from '../classes/api-error';

export const buildMongooseModel = <DocType, Model extends BaseMongoosePaginateModel<DocType, InstanceMethodsAndOverrides, QueryHelpers>, InstanceMethodsAndOverrides = {}, QueryHelpers = {}>(
	collection: string,
	name: string,
	schema: Schema<DocType, Model, InstanceMethodsAndOverrides, QueryHelpers>,
	options?: BuildMongooseModelOptions
) => {
	schema.static('findByRouteId', function (event: H3Event, projection?: Nullable<ProjectionType<DocType>>, options?: Nullable<QueryOptions<DocType>>) {
		return this.findById(getRouterParam(event, 'id'), projection, options);
	});

	schema.static('findByRouteIdOrThrowNotFoundError', async function (event: H3Event, projection?: Nullable<ProjectionType<DocType>>, options?: Nullable<QueryOptions<DocType>>) {
		const document = (await this.findById(getRouterParam(event, 'id'), projection, options)) as Nullable<MongooseHydratedDocument<DocType, InstanceMethodsAndOverrides, QueryHelpers>>;
		if (!document) throw new ApiError(404);
		return document;
	});

	return _buildMongooseModel(collection, name, schema, options);
};
