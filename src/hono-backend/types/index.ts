import type { StatusCode as _StatusCode } from 'hono/utils/http-status';

declare global {
	type StatusCode = _StatusCode;
}
