import { z as _z } from '../../constants/zod';

declare global {
	var z: typeof _z;
}

globalThis.z = _z;
