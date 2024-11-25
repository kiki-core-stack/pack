import { redisInstance } from '@/constants/redis';
import type { AdminDocument } from '@/models/admin';

export const redisController = {
    twoFactorAuthentication: {
        emailOTPCode: createOperateFunctions((admin: AdminDocument) => `admin:emailOTPCode:${admin.id}:${admin.email}`),
        tempTOTPSecret: createOperateFunctions((admin: AdminDocument) => `admin:tempTOTPSecret:${admin.id}`),
    },
};

function createOperateFunctions<T>(getKeyFunction: (input: T) => string) {
    return {
        del: (input: T) => redisInstance.del(getKeyFunction(input)),
        get: (input: T) => redisInstance.get(getKeyFunction(input)),
        async set(input: T, value: string, seconds?: number) {
            if (seconds) await redisInstance.setex(getKeyFunction(input), seconds, value);
            else await redisInstance.set(getKeyFunction(input), value);
        },
        ttl: (input: T) => redisInstance.ttl(getKeyFunction(input)),
    };
}
