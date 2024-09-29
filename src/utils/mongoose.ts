import type { BuildMongooseModelOptions } from '@kikiutils/mongoose/types/options';
import { buildMongooseModel as _buildMongooseModel } from '@kikiutils/mongoose/utils';
import { getRouterParam } from 'h3';
import type { H3Event } from 'h3';
import { Types } from 'mongoose';
import type { ProjectionType, QueryOptions, Schema, RootFilterQuery } from 'mongoose';

import { createApiErrorAndThrow } from '../nitropack/utils/api-response';

export const buildMongooseModel = <DocType, Model extends BaseMongoosePaginateModel<DocType, InstanceMethodsAndOverrides, QueryHelpers>, InstanceMethodsAndOverrides = {}, QueryHelpers = {}>(
	collection: string,
	name: string,
	schema: Schema<DocType, Model, InstanceMethodsAndOverrides, QueryHelpers>,
	options?: BuildMongooseModelOptions
) => {
	schema.static('findByRouteId', function (event: H3Event, projection?: Nullable<ProjectionType<DocType>>, options?: Nullable<QueryOptions<DocType>>) {
		return this.findById(getRouterParam(event, 'id'), projection, options);
	});

	schema.static('findByRouteIdOrThrowNotFoundError', async function (event: H3Event, filterQuery?: RootFilterQuery<DocType>, projection?: Nullable<ProjectionType<DocType>>, options?: Nullable<QueryOptions<DocType>>) {
		const id = getRouterParam(event, 'id');
		if (!id) createApiErrorAndThrow(404);
		if (!Types.ObjectId.isValid(id)) createApiErrorAndThrow(400);
		const document = await this.findOne({ ...filterQuery, _id: id }, projection, options);
		if (!document) createApiErrorAndThrow(404);
		return document;
	});

	return _buildMongooseModel(collection, name, schema, options);
};
