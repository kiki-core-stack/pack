import { commonMongooseSchemas as _commonMongooseSchemas } from '@kikiutils/mongoose/constants';
import { createCommonMongooseSchemas, createMongooseObjectIdRefSchema } from '@kikiutils/mongoose/utils';

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
