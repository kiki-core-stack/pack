import { checkAndGetEnvValue } from '@kikiutils/node/env';

import type {
    LocalStorageProviderConfig,
    StorageProvider,
    StorageProviderName,
} from './types';

export async function createStorage(provider?: 'local-storage', config?: LocalStorageProviderConfig): Promise<StorageProvider>;
export async function createStorage(provider?: StorageProviderName, config?: any): Promise<StorageProvider> {
    const storageProvider = provider || checkAndGetEnvValue('STORAGE_PROVIDER');
    if (storageProvider === 'local-storage') {
        const { LocalStorageProvider } = await import('./providers/local-storage');
        return new LocalStorageProvider(config);
    }

    throw new Error(`Unsupported STORAGE_PROVIDER: "${storageProvider}". Supported providers: local-storage`);
}
