import { commonMongooseSchemas as _commonMongooseSchemas } from '@kikiutils/mongoose/constants';
import { createCommonMongooseSchemas } from '@kikiutils/mongoose/utils';

export const commonMongooseSchemas = (() => {
	return createCommonMongooseSchemas({} as const);
})();
