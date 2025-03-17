import './api-error';
import './api-utils';

import { setReadonlyConstantToGlobalThis } from '@kikiutils/node';

import { z as _z } from '@/constants/zod';

declare global {
    const z: typeof _z;
}

setReadonlyConstantToGlobalThis<typeof z>('z', _z);
