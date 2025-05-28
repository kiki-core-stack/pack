import * as z from 'zod';

export function strictIsoDateString() {
    return z.string().refine((value) => {
        const date = new Date(value);
        return !Number.isNaN(date.getTime()) && value === date.toISOString();
    });
}
