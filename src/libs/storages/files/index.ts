import { getRequiredEnv } from '@kikiutils/shared/env';
import { S3Client } from 'bun';

/**
 * - `public`: anonymous reads are allowed by the bucket policy and served through the gateway or a CDN; keys are
 *   content-addressed and never overwritten, so responses can be cached indefinitely.
 * - `private`: no anonymous access; only backends read and write it, and serve its files themselves.
 */
export type FileStorageVisibility = 'private' | 'public';

// Constants/Variables
const bucketNamePattern = /^[a-z\d][a-z\d-]{1,61}[a-z\d]$/;
const visibilityToClientMap = new Map<FileStorageVisibility, S3Client>();

// Functions

/**
 * S3 client of the bucket `<PROJECT_NAME>-<ENVIRONMENT>-<visibility>`. Created on first use, so processes that never
 * touch files need no storage environment variables.
 */
export function getFileStorage(visibility: FileStorageVisibility) {
    let client = visibilityToClientMap.get(visibility);
    if (client) return client;
    const bucket = `${getRequiredEnv('PROJECT_NAME')}-${getRequiredEnv('ENVIRONMENT')}-${visibility}`;
    if (!bucketNamePattern.test(bucket)) throw new Error(`Invalid file storage bucket name: ${bucket}`);
    client = new S3Client({
        accessKeyId: getRequiredEnv('FILE_STORAGE_S3_ACCESS_KEY_ID'),
        bucket,
        endpoint: getRequiredEnv('FILE_STORAGE_S3_ENDPOINT'),
        region: process.env.FILE_STORAGE_S3_REGION || undefined,
        secretAccessKey: getRequiredEnv('FILE_STORAGE_S3_SECRET_ACCESS_KEY'),
    });

    visibilityToClientMap.set(visibility, client);
    return client;
}
