import { objectId } from './object-id';

export function fileId() {
    return objectId().check(async (ctx) => {
        const { FileModel } = await import('../../models/file');
        if (await FileModel.exists({ _id: ctx.value })) return;
        ctx.issues.push({
            code: 'custom',
            input: ctx.value,
            message: 'File not found',
            params: { reason: 'fileNotFound' },
        });
    });
}
