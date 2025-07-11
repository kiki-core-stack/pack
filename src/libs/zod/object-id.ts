import { Types } from 'mongoose';
import * as z from 'zod';

export function objectId() {
    return z
        .string()
        .check((ctx) => {
            if (Types.ObjectId.isValid(ctx.value)) return;
            ctx.issues.push({
                code: 'invalid_format',
                format: 'objectid',
                input: ctx.value,
                message: 'Invalid ObjectId.',
            });
        })
        .transform((value) => new Types.ObjectId(value));
}

export function objectIdOrEmptyString() {
    return z
        .string()
        .check((ctx) => {
            if (ctx.value === '' || Types.ObjectId.isValid(ctx.value)) return;
            ctx.issues.push({
                code: 'invalid_format',
                format: 'objectid',
                input: ctx.value,
                message: 'Invalid ObjectId.',
            });
        })
        .transform((value) => new Types.ObjectId(value));
}
