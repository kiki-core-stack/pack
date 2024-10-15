import { z as _z } from '../../constants/zod';
import './api-error';
import './api-utils';

declare global {
	var z: typeof _z;
}

globalThis.z = _z;
