import { customMongooseOptions } from '@kikiutils/mongoose/options';
import { getRouterParam } from 'h3';
import type { H3Event } from 'h3';
import { Types } from 'mongoose';
import type { Schema } from 'mongoose';
import type { ProjectionType, QueryOptions, RootFilterQuery } from 'mongoose';

import { createApiErrorAndThrow } from '../utils/api-response';

customMongooseOptions.beforeModelBuild = <DocType, Model extends BaseMongoosePaginateModel<DocType, InstanceMethodsAndOverrides, QueryHelpers>, InstanceMethodsAndOverrides = {}, QueryHelpers = {}>(
	schema: Schema<DocType, Model, InstanceMethodsAndOverrides, QueryHelpers>
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
};

export default () => {};
