import { createCommonMongooseSchemas, createMongooseObjectIdRefSchema } from '@kikiutils/mongoose/utils';

export { mongooseConnections } from '@kikiutils/mongoose/constants';

export const commonMongooseSchemas = (() => {
	return createCommonMongooseSchemas({
		ref: {
			admin: {
				nonRequired: createMongooseObjectIdRefSchema('Admin'),
				required: createMongooseObjectIdRefSchema('Admin', 'required')
			}
		}
	} as const);
})();
