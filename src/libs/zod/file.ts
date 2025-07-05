import { FileModel } from '../../models/file';

import { objectId } from './object-id';

export function fileId() {
    return objectId().check(async (ctx) => {
        if (await FileModel.exists({ _id: ctx.value })) return;
        ctx.issues.push({
            code: 'custom',
            input: ctx.value,
            message: 'File not found.',
            params: { reason: 'fileNotFound' },
        });
    });
}
