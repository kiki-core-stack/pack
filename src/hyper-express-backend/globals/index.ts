import { setReadonlyConstantToGlobalThis } from '@kikiutils/node/object';

import { z as _z } from '../../constants/zod';
import './api-error';
import './api-utils';

declare global {
	const z: typeof _z;
}

setReadonlyConstantToGlobalThis('z', _z);
