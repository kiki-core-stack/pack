import { Buffer } from 'node:buffer';
import {
    mkdtemp,
    rm,
    writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';

import { Path } from '@kikiutils/shared/classes/path';
import {
    afterEach,
    beforeEach,
    describe,
    it,
} from 'vitest';

import { LocalFileStorage } from '../../../../src/libs/storages/files/local';

const originalFileStorageLocalBasePath = process.env.FILE_STORAGE_LOCAL_BASE_PATH;
let tempDirPaths: string[] = [];

async function createTempDir() {
    const tempDirPath = await mkdtemp(Path.resolve(tmpdir(), 'kiki-pack-local-storage-').toString());
    tempDirPaths.push(tempDirPath);
    return new Path(tempDirPath);
}

beforeEach(() => {
    process.env.FILE_STORAGE_LOCAL_BASE_PATH = originalFileStorageLocalBasePath;
});

afterEach(async () => {
    await Promise.all(
        tempDirPaths.map(
            (tempDirPath) => rm(
                tempDirPath,
                {
                    force: true,
                    recursive: true,
                },
            ),
        ),
    );

    tempDirPaths = [];
    process.env.FILE_STORAGE_LOCAL_BASE_PATH = originalFileStorageLocalBasePath;
});

describe('local file storage', () => {
    it('should upload under FILE_STORAGE_LOCAL_BASE_PATH when no config is passed', async ({ expect }) => {
        const basePath = await createTempDir();
        process.env.FILE_STORAGE_LOCAL_BASE_PATH = basePath.toString();
        const storage = new LocalFileStorage();

        const result = await storage.upload(Buffer.from('test file'), undefined, 'webp');

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.path).toMatch(/^\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{64}\.webp$/);
            expect(await storage.exists(result.value.path)).toStrictEqual({
                ok: true,
                value: true,
            });
        }
    });

    it('should keep generated upload paths relative to storage base path', async ({ expect }) => {
        const basePath = await createTempDir();
        const storage = new LocalFileStorage({ basePath: basePath.toString() });

        const result = await storage.upload(Buffer.from('test file'), undefined, 'txt');

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.path).toMatch(/^\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{64}\.txt$/);
            expect(await storage.exists(result.value.path)).toStrictEqual({
                ok: true,
                value: true,
            });
        }
    });

    it('should report missing files as not existing', async ({ expect }) => {
        const basePath = await createTempDir();
        const storage = new LocalFileStorage({ basePath: basePath.toString() });

        await expect(storage.exists('/missing/file.txt')).resolves.toStrictEqual({
            ok: true,
            value: false,
        });
    });

    it('should read uploaded files as buffers', async ({ expect }) => {
        const basePath = await createTempDir();
        const storage = new LocalFileStorage({ basePath: basePath.toString() });
        const content = Buffer.from('read me');

        const uploadResult = await storage.upload(content, 'nested/file.txt');

        expect(uploadResult.ok).toBe(true);
        await expect(storage.read('/nested/file.txt')).resolves.toStrictEqual({
            ok: true,
            value: content,
        });

        await expect(storage.getBuffer('nested/file.txt')).resolves.toStrictEqual({
            ok: true,
            value: content,
        });
    });

    it('should wrap missing file read errors', async ({ expect }) => {
        const basePath = await createTempDir();
        const storage = new LocalFileStorage({ basePath: basePath.toString() });

        const result = await storage.read('/missing/file.txt');

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(Error);
            expect((result.error as Error).message).toContain('Read file failed: /missing/file.txt');
            expect((result.error as Error).message).toContain('ENOENT');
        }
    });

    it('should delete files inside storage base path', async ({ expect }) => {
        const basePath = await createTempDir();
        const storage = new LocalFileStorage({ basePath: basePath.toString() });
        const uploadResult = await storage.upload(Buffer.from('delete me'), 'nested/file.txt');
        expect(uploadResult.ok).toBe(true);

        await expect(storage.delete('/nested/file.txt')).resolves.toStrictEqual({ ok: true });
        await expect(storage.exists('nested/file.txt')).resolves.toStrictEqual({
            ok: true,
            value: false,
        });
    });

    it('should treat absolute-looking storage paths as relative stored paths', async ({ expect }) => {
        const basePath = await createTempDir();
        const storage = new LocalFileStorage({ basePath: basePath.toString() });

        const result = await storage.upload(Buffer.from('absolute-like'), '/nested/file.txt');

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.path).toBe('/nested/file.txt');
            await expect(basePath.join('nested/file.txt').readFile('utf8')).resolves.toBe('absolute-like');
        }
    });

    it('should reject traversal paths without touching files outside storage base path', async ({ expect }) => {
        const parentPath = await createTempDir();
        const basePath = parentPath.join('storage');
        const outsideFilePath = parentPath.join('outside.txt');
        await writeFile(outsideFilePath.toString(), 'keep');
        const storage = new LocalFileStorage({ basePath: basePath.toString() });

        const uploadResult = await storage.upload(Buffer.from('bad'), '../outside.txt');
        const deleteResult = await storage.delete('../outside.txt');
        const readResult = await storage.read('../outside.txt');

        expect(uploadResult.ok).toBe(false);
        expect(deleteResult.ok).toBe(false);
        expect(readResult.ok).toBe(false);
        await expect(outsideFilePath.readFile('utf8')).resolves.toBe('keep');
    });

    it('should reject empty paths', async ({ expect }) => {
        const basePath = await createTempDir();
        const storage = new LocalFileStorage({ basePath: basePath.toString() });

        await expect(storage.delete('')).resolves.toMatchObject({ ok: false });
        await expect(storage.read('')).resolves.toMatchObject({ ok: false });
        await expect(storage.upload(Buffer.from('bad'), '')).resolves.toMatchObject({ ok: false });
    });
});
