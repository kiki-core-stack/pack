import type { Buffer } from 'node:buffer';

import { redisInstance } from '@/constants/redis';
import type { AdminDocument } from '@/models/admin';

export const redisController = {
    twoFactorAuthentication: {
        emailOTPCode: createOperateFunctions((admin: AdminDocument) => `admin:emailOTPCode:${admin.id}:${admin.email}`),
        tempTOTPSecret: createOperateFunctions((admin: AdminDocument) => `admin:tempTOTPSecret:${admin.id}`),
    },
};

function createOperateFunctions<F extends (...args: any[]) => string>(getKeyFunction: F) {
    return {
        del: (...args: Parameters<F>) => redisInstance.del(getKeyFunction(...args)),
        get: (...args: Parameters<F>) => redisInstance.get(getKeyFunction(...args)),
        getBuffer: (...args: Parameters<F>) => redisInstance.getBuffer(getKeyFunction(...args)),
        getdel: (...args: Parameters<F>) => redisInstance.getdel(getKeyFunction(...args)),
        getdelBuffer: (...args: Parameters<F>) => redisInstance.getdelBuffer(getKeyFunction(...args)),
        // TODO: overloads
        getex: (...args: Parameters<F>) => redisInstance.getex(getKeyFunction(...args)),
        set: (value: string, ...args: Parameters<F>) => redisInstance.set(getKeyFunction(...args), value),
        setex: (seconds: number, value: Buffer | number | string, ...args: Parameters<F>) => redisInstance.setex(getKeyFunction(...args), seconds, value),
        ttl: (...args: Parameters<F>) => redisInstance.ttl(getKeyFunction(...args)),
    };
}
