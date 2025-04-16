import { redisStorage } from './';

export function createRedisStoreKeyHandler<D = any>() {
    return <P extends any[]>(getKeyFunction: (...args: P) => string) => ({
        getItem: (...args: P) => redisStorage.getItem<D>(getKeyFunction(...args)),
        getItemTtl: (...args: P) => redisStorage.getItemTtl(getKeyFunction(...args)),
        removeItem: (...args: P) => redisStorage.removeItem(getKeyFunction(...args)),
        setItem: (value: D, ...args: P) => redisStorage.setItem(getKeyFunction(...args), value),
        setItemWithTtl: (seconds: number, value: D, ...args: P) => {
            return redisStorage.setItemWithTtl(getKeyFunction(...args), seconds, value);
        },
    });
}
