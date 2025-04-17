import type { createRedisStorage } from './create';

export function createRedisStoreKeyHandler<D = any>(storage: ReturnType<typeof createRedisStorage>) {
    return <P extends any[]>(getKeyFunction: (...args: P) => string) => ({
        getItem: (...args: P) => storage.getItem<D>(getKeyFunction(...args)),
        getItemTtl: (...args: P) => storage.getItemTtl(getKeyFunction(...args)),
        removeItem: (...args: P) => storage.removeItem(getKeyFunction(...args)),
        setItem: (value: D, ...args: P) => storage.setItem(getKeyFunction(...args), value),
        setItemWithTtl: (seconds: number, value: D, ...args: P) => {
            return storage.setItemWithTtl(getKeyFunction(...args), seconds, value);
        },
    });
}
