import type { Request } from '@kikiutils/hyper-express';
import { customMongooseOptions } from '@kikiutils/mongoose/options';
import { Types } from 'mongoose';
import type { HydratedDocument, ProjectionType, QueryOptions, RootFilterQuery, Schema } from 'mongoose';

declare module '@kikiutils/mongoose/types' {
	interface BaseModelStatics<RawDocType, InstanceMethodsAndOverrides = {}, QueryHelpers = {}> {
		findByRouteId(
			request: Request,
			projection?: Nullable<ProjectionType<RawDocType>>,
			options?: Nullable<QueryOptions<RawDocType>>
		): MongooseFindOneReturnType<RawDocType, HydratedDocument<RawDocType, InstanceMethodsAndOverrides, QueryHelpers>, QueryHelpers, InstanceMethodsAndOverrides>;

		findByRouteIdOrThrowNotFoundError(
			request: Request,
			filterQuery?: RootFilterQuery<RawDocType>,
			projection?: Nullable<ProjectionType<RawDocType>>,
			options?: Nullable<QueryOptions<RawDocType>>
		): Promise<HydratedDocument<RawDocType, InstanceMethodsAndOverrides, QueryHelpers>>;
	}
}

customMongooseOptions.beforeModelBuild = <DocType, Model extends BaseMongoosePaginateModel<DocType, InstanceMethodsAndOverrides, QueryHelpers>, InstanceMethodsAndOverrides = {}, QueryHelpers = {}>(
	schema: Schema<DocType, Model, InstanceMethodsAndOverrides, QueryHelpers>
) => {
	schema.static('findByRouteId', function (request: Request, projection?: Nullable<ProjectionType<DocType>>, options?: Nullable<QueryOptions<DocType>>) {
		return this.findById(request.param('id'), projection, options);
	});

	schema.static('findByRouteIdOrThrowNotFoundError', async function (request: Request, filterQuery?: RootFilterQuery<DocType>, projection?: Nullable<ProjectionType<DocType>>, options?: Nullable<QueryOptions<DocType>>) {
		const id = request.param('id');
		if (!id) throwApiError(404);
		if (!Types.ObjectId.isValid(id)) throwApiError(400);
		const document = await this.findOne({ ...filterQuery, _id: id }, projection, options);
		if (!document) throwApiError(404);
		return document;
	});
};
