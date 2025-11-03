import type { MaybeReadonly } from '@kikiutils/shared/types';

import type { RedisLikeStorage } from './types';

export function createKeyedRedisStore<D = unknown>(storage: MaybeReadonly<RedisLikeStorage>) {
    return <P extends any[]>(getKeyFunction: (...args: P) => string) => Object.freeze({
        getItem: (...args: P) => storage.getItem<D>(getKeyFunction(...args)),
        getItemTtl: (...args: P) => storage.getItemTtl(getKeyFunction(...args)),
        hasItem: (...args: P) => storage.hasItem(getKeyFunction(...args)),
        removeItem: (...args: P) => storage.removeItem(getKeyFunction(...args)),
        resolveKey: (...args: P) => getKeyFunction(...args),
        setItem: (value: D, ...args: P) => storage.setItem(getKeyFunction(...args), value),
        setItemWithTtl(ttlSeconds: number, value: D, ...args: P) {
            return storage.setItemWithTtl(getKeyFunction(...args), ttlSeconds, value);
        },
    });
}
