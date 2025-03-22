import type { Buffer } from 'node:buffer';

import { redisInstance } from '@/constants/redis';

export const redisController = {};

// @ts-expect-error Ignore this error.
// eslint-disable-next-line unused-imports/no-unused-vars
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
        setex: (seconds: number, value: Buffer | number | string, ...args: Parameters<F>) => {
            return redisInstance.setex(getKeyFunction(...args), seconds, value);
        },
        ttl: (...args: Parameters<F>) => redisInstance.ttl(getKeyFunction(...args)),
    };
}
