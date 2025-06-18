import { Types } from 'mongoose';
import * as z from 'zod/v4';

export function objectId() {
    return z
        .string()
        .refine((value) => Types.ObjectId.isValid(value), 'Invalid ObjectId.')
        .transform((value) => new Types.ObjectId(value));
}

export function objectIdOrEmptyString() {
    return z
        .string()
        .refine((value) => !value || Types.ObjectId.isValid(value), 'Invalid ObjectId or empty string.')
        .transform((value) => value ? new Types.ObjectId(value) : '');
}
