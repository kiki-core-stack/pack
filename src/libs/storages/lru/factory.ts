import type { createLruStorage } from './create';

export function createLruStoreKeyHandler<D = any>(storage: ReturnType<typeof createLruStorage>) {
    return <P extends any[]>(getKeyFunction: (...args: P) => string) => ({
        getItem: (...args: P) => storage.getItem<D>(getKeyFunction(...args)),
        getItemTtl: (...args: P) => storage.getItemTtl(getKeyFunction(...args)),
        removeItem: (...args: P) => storage.removeItem(getKeyFunction(...args)),
        setItem: (value: D, ...args: P) => storage.setItem(getKeyFunction(...args), value),
    });
}
