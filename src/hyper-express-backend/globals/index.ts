import { z as _z } from '../../constants/zod';
import './api-error';
import './api-utils';

declare global {
	const z: typeof _z;
}

Object.defineProperty(globalThis, 'z', {
	configurable: false,
	value: _z,
	writable: false
});
