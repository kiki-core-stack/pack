import { redisInstance } from '@/constants/redis';
import type { AdminDocument } from '@/models/admin';

export const redisController = (() => {
	const createOperateFunctions = <T>(getKeyFunction: (input: T) => string) => ({
		del: async (input: T) => await redisInstance.del(getKeyFunction(input)),
		get: async (input: T) => await redisInstance.get(getKeyFunction(input)),
		async set(input: T, value: string, seconds?: number) {
			if (seconds) await redisInstance.setex(getKeyFunction(input), seconds, value);
			else await redisInstance.set(getKeyFunction(input), value);
		},
		ttl: async (input: T) => await redisInstance.ttl(getKeyFunction(input))
	});

	return {
		twoFactorAuthentication: {
			emailOTPCode: createOperateFunctions((admin: AdminDocument) => `admin:emailOTPCode:${admin.id}:${admin.email}`),
			tempTOTPSecret: createOperateFunctions((admin: AdminDocument) => `admin:tempTOTPSecret:${admin.id}`)
		}
	};
})();
