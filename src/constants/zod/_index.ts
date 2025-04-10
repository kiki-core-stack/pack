import { Types } from 'mongoose';
import { z } from 'zod';

export * from 'zod';

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

export function telegramSuperGroupId() {
    return z.string().refine((value) => /^-100\d{10}$/.test(value), { message: 'Invalid Telegram Super Group Id' });
}
