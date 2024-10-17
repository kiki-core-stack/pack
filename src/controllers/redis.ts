import { redisInstance } from '@/constants/redis';
import type { AdminDocument } from '@/models';

export const redisController = (() => ({
	twoFactorAuthentication: (() => {
		const createOperateFunctions = (getKeyFunction: (admin: AdminDocument) => string) => ({
			del: async (admin: AdminDocument) => await redisInstance.del(getKeyFunction(admin)),
			get: async (admin: AdminDocument) => await redisInstance.get(getKeyFunction(admin)),
			async set(admin: AdminDocument, value: string, seconds?: number) {
				if (seconds) await redisInstance.setex(getKeyFunction(admin), seconds, value);
				else await redisInstance.set(getKeyFunction(admin), value);
			},
			ttl: async (admin: AdminDocument) => await redisInstance.ttl(getKeyFunction(admin))
		});

		return {
			emailOtpCode: createOperateFunctions((admin: AdminDocument) => `admin:emailOtpCode:${admin.id}:${admin.email}`),
			tempTotpSecret: createOperateFunctions((admin: AdminDocument) => `admin:tempTotpSecret:${admin.id}`)
		};
	})()
}))();
