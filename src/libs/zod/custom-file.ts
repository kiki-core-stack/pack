import { Blob as BufferBlob } from 'node:buffer';

import { ZodType } from 'zod/v4';
import type { _ZodType } from 'zod/v4';
import {
    $constructor,
    $ZodCustom,
    _maxSize,
    _minSize,
    util,
} from 'zod/v4/core';
import type {
    $ZodCheckMaxSizeParams,
    $ZodCheckMinSizeParams,
    $ZodCustomInternals,
    $ZodCustomParams,
} from 'zod/v4/core';

import { getFileMimeType } from '../../utils/file';

interface ZodCustomFile extends
    $ZodCustom<BufferBlob, BufferBlob>,
    _ZodType<$ZodCustomInternals<BufferBlob, BufferBlob>> {
    commonImages: () => this;
    gif: () => this;
    jpeg: () => this;
    maxSize: (bytes: number, params?: $ZodCheckMaxSizeParams | string) => this;
    maxSizeKb: (kb: number, params?: $ZodCheckMaxSizeParams | string) => this;
    maxSizeMb: (mb: number, params?: $ZodCheckMaxSizeParams | string) => this;
    mimeType: (...mimeTypes: Readonlyable<Arrayable<string>>[]) => this;
    minSize: (bytes: number, params?: $ZodCheckMinSizeParams | string) => this;
    minSizeKb: (kb: number, params?: $ZodCheckMinSizeParams | string) => this;
    minSizeMb: (mb: number, params?: $ZodCheckMinSizeParams | string) => this;
    png: () => this;
    webp: () => this;
}

const commonImageMimeTypes: readonly string[] = [
    'image/bmp',
    'image/heic',
    'image/heif',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/webp',
];

// eslint-disable-next-line style/max-len
// TODO: Dealing with the problem of multiple MIME acquisitions with a single parse using the MIME type check multiple times
export const ZodCustomFile: $constructor<ZodCustomFile> = /* @__PURE__ */ $constructor(
    'ZodCustomFile',
    (inst, def) => {
        $ZodCustom.init(inst, def);
        ZodType.init(inst, def);

        const params = def.params as { _allowedMimeTypes: Set<string> };

        function createCheckMimeTypesFunction(...mimeTypes: Readonlyable<Arrayable<string>>[]) {
            return () => {
                [mimeTypes].flat(2).forEach((mimeType) => params._allowedMimeTypes.add(mimeType));
                return inst.check(async (ctx) => {
                    const detectedMimeType = await getFileMimeType(ctx.value);
                    if (!detectedMimeType || !params._allowedMimeTypes.has(detectedMimeType)) {
                        ctx.issues.push({
                            code: 'custom',
                            input: ctx.value,
                            // eslint-disable-next-line style/max-len
                            message: `Invalid MIME type: ${detectedMimeType}. Allowed types: ${[...params._allowedMimeTypes].join(', ')}.`,
                        });
                    }
                });
            };
        }

        inst.commonImages = createCheckMimeTypesFunction(commonImageMimeTypes);
        inst.gif = createCheckMimeTypesFunction('image/gif');
        inst.jpeg = createCheckMimeTypesFunction('image/jpeg');
        inst.maxSize = (bytes, params) => inst.check(_maxSize(bytes, params));
        inst.maxSizeKb = (kb, params) => inst.check(_maxSize(kb * 1024, params));
        inst.maxSizeMb = (mb, params) => inst.check(_maxSize(mb * 1024 * 1024, params));
        inst.mimeType = (...mimeTypes) => createCheckMimeTypesFunction(...mimeTypes)();
        inst.minSize = (bytes, params) => inst.check(_minSize(bytes, params));
        inst.minSizeKb = (kb, params) => inst.check(_minSize(kb * 1024, params));
        inst.minSizeMb = (mb, params) => inst.check(_minSize(mb * 1024 * 1024, params));
        inst.png = createCheckMimeTypesFunction('image/png');
        inst.webp = createCheckMimeTypesFunction('image/webp');
    },
);

export function customFile(
    params: $ZodCustomParams | string = { error: `Input not instance of ${BufferBlob.name}.` },
): ZodCustomFile {
    const normalizedParams = util.normalizeParams(params);
    normalizedParams.params = {
        ...normalizedParams.params,
        _allowedMimeTypes: new Set<string>(),
    };

    const inst = new ZodCustomFile({
        abort: true,
        check: 'custom',
        fn: (data) => data instanceof BufferBlob,
        type: 'custom',
        ...normalizedParams,
    });

    inst._zod.bag.Class = BufferBlob;
    return inst;
}
