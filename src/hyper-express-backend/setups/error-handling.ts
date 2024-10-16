import type { Server } from '@kikiutils/hyper-express';
import logger from '@kikiutils/node/consola';
import { MongoServerError } from 'mongodb';
import { ZodError } from 'zod';

import { statusCodeToAPIResponseTextMap } from '../constants/response';

const mongodbErrorCodeToHttpStatusCodeMap = Object.freeze<Dict<number>>({
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

export const setupServerErrorHandling = (server: Server) => {
	server.set_error_handler((_, response, error) => {
		response.header('Content-Type', 'application/json');
		if (error instanceof APIError) return response.status(error.statusCode).send(JSON.stringify({ data: error.data, message: error.message, success: false }));
		logger.error(error);
		if (error instanceof ZodError) return response.status(400).send(statusCodeToAPIResponseTextMap[400]);
		let statusCode = 500;
		if (error instanceof MongoServerError && error.code) statusCode = mongodbErrorCodeToHttpStatusCodeMap[error.code] || 500;
		return response.status(statusCode).send(statusCodeToAPIResponseTextMap[statusCode]);
	});

	server.set_not_found_handler((_, response) => response.header('Content-Type', 'application/json').status(404).send(statusCodeToAPIResponseTextMap[404]));
};
