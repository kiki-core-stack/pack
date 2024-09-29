import type { H3Event } from 'h3';
import type { HydratedDocument, ProjectionType, QueryOptions } from 'mongoose';

export type {} from '@kikiutils/mongoose/types';

declare module '@kikiutils/mongoose/types' {
	interface BaseModelStatics<RawDocType, InstanceMethodsAndOverrides = {}, QueryHelpers = {}> {
		findByRouteId(
			event: H3Event,
			projection?: Nullable<ProjectionType<RawDocType>>,
			options?: Nullable<QueryOptions<RawDocType>>
		): MongooseFindOneReturnType<RawDocType, HydratedDocument<RawDocType, InstanceMethodsAndOverrides, QueryHelpers>, QueryHelpers, InstanceMethodsAndOverrides>;

		findByRouteIdOrThrowNotFoundError(event: H3Event, projection?: Nullable<ProjectionType<RawDocType>>, options?: Nullable<QueryOptions<RawDocType>>): Promise<HydratedDocument<RawDocType, InstanceMethodsAndOverrides, QueryHelpers>>;
	}
}
