import { isError } from 'h3';
import { mongo } from 'mongoose';
import type { NitroApp } from 'nitropack';

import ApiError from '../../classes/api-error';

const mongodbErrorCodeToHttpStatusCodeMap = Object.freeze<Record<number | string, number>>({
	2: 400, // BadValue -> Bad Request
	4: 404, // NoSuchKey -> Not Found
	6: 503, // HostUnreachable -> Service Unavailable
	7: 503, // HostNotFound -> Service Unavailable
	9: 400, // FailedToParse -> Bad Request
	13: 401, // Unauthorized -> Unauthorized
	14: 400, // TypeMismatch -> Bad Request
	16: 400, // InvalidLength -> Bad Request
	20: 400, // IllegalOperation -> Bad Request
	22: 400, // InvalidBSON -> Bad Request
	24: 504, // LockTimeout -> Gateway Timeout
	26: 404, // NamespaceNotFound -> Not Found
	27: 404, // IndexNotFound -> Not Found
	50: 504, // MaxTimeMSExpired -> Gateway Timeout
	66: 400, // ImmutableField -> Bad Request
	72: 400, // InvalidOptions -> Bad Request
	73: 400, // InvalidNamespace -> Bad Request
	89: 504, // NetworkTimeout -> Gateway Timeout
	11000: 409, // DuplicateKey -> Conflict
	13297: 409, // DatabaseDifferCase -> Conflict
	13436: 503, // NotPrimaryOrSecondary -> Service Unavailable
	14031: 507, // OutOfDiskSpace -> Insufficient Storage
	16755: 400 // Location16755 -> Bad Request
});

export default (nitroApp: NitroApp) => {
	nitroApp.hooks.hook('error', (error: Error) => {
		if (!isError(error)) return;
		let errorStatusCode = 500;
		if (error.cause instanceof mongo.MongoServerError && error.cause.code) errorStatusCode = mongodbErrorCodeToHttpStatusCodeMap[error.cause.code] || 500;
		else {
			try {
				const messageData: Partial<ApiResponseData> = JSON.parse((error.cause as any)?.message);
				if (messageData.success !== undefined) return;
			} catch {}
		}

		const newError = new ApiError(errorStatusCode);
		error.cause = newError.cause;
		error.message = newError.message;
		error.statusCode = errorStatusCode;
	});
};
