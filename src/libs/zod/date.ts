import * as z from 'zod/v4';

export const strictIsoDate = () => strictIsoDateString().transform((value) => new Date(value));

export function strictIsoDateString() {
    return z.string().refine((value) => {
        const date = new Date(value);
        return !Number.isNaN(date.getTime()) && value === date.toISOString();
    });
}
