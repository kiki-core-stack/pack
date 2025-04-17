import { Types } from 'mongoose';
import * as z from 'zod';

export function objectId() {
    return z.string().refine((value) => Types.ObjectId.isValid(value), { message: 'Invalid ObjectId' });
}

export function objectIdOrEmptyString() {
    return z
        .string()
        .refine(
            (value) => !value || Types.ObjectId.isValid(value),
            { message: 'Invalid ObjectId or empty string' },
        );
}
