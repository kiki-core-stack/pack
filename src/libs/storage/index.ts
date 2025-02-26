import { checkAndGetEnvValue } from '@kikiutils/node/env';

import type { BaseStorageProvider } from './providers/base';
import type {
    LocalStorageProviderConfig,
    StorageProviderName,
} from './types';

let defaultStorageInstance: Nullable<BaseStorageProvider> = null;

export async function createStorage(provider?: 'local-storage', config?: LocalStorageProviderConfig): Promise<BaseStorageProvider>;
export async function createStorage(provider?: StorageProviderName, config?: any): Promise<BaseStorageProvider> {
    const storageProvider = provider || checkAndGetEnvValue('STORAGE_PROVIDER');
    if (storageProvider === 'local-storage') {
        const { LocalStorageProvider } = await import('./providers/local-storage');
        return new LocalStorageProvider(config);
    }

    throw new Error(`Unsupported STORAGE_PROVIDER: "${storageProvider}". Supported providers: local-storage`);
}

export async function getDefaultStorage(): Promise<BaseStorageProvider> {
    if (!defaultStorageInstance) defaultStorageInstance = await createStorage();
    return defaultStorageInstance;
}
