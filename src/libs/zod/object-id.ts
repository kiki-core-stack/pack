import { Types } from 'mongoose';
import * as z from 'zod';

// Constants/Variables
const objectIdHexStringOrEmptyRegex = /^(?:[\dA-F]{24})?$/i;
const objectIdHexStringRegex = /^[\dA-F]{24}$/i;

// Functions
export const objectId = () => objectIdString().transform((value) => new Types.ObjectId(value));

export function objectIdOrEmptyString() {
    return z
        .string()
        .regex(objectIdHexStringOrEmptyRegex, 'Invalid ObjectId or empty string')
        .meta({ format: 'objectid' })
        .transform((value) => value === '' ? value : new Types.ObjectId(value));
}

export function objectIdString() {
    return z.string().regex(objectIdHexStringRegex, 'Invalid ObjectId').meta({ format: 'objectid' });
}
