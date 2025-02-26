import type { StorageProvider } from './providers/base';

export async function createStorage(): Promise<StorageProvider> {
    const storageType = process.env.STORAGE_TYPE || 'local';
    if (storageType === 'local') {
        const { LocalStorageProvider } = await import('./providers/local-storage');
        return new LocalStorageProvider();
    }

    throw new Error(`Unsupported STORAGE_TYPE: "${storageType}". Supported types: local`);
}
