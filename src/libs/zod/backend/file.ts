import * as z from '../';
import { FileModel } from '../../../models/file';

export function fileId() {
    return z.objectId().check(async (ctx) => {
        if (await FileModel.exists({ _id: ctx.value })) return;
        ctx.issues.push({
            code: 'custom',
            input: ctx.value,
            message: 'File not found',
            params: { reason: 'fileNotFound' },
        });
    });
}
