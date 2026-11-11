import { Types } from 'mongoose';
import * as z from 'zod';

// Constants/Variables
// Inputs are lowercased first, so the patterns stay flag-free and exact in JSON Schema.
const objectIdHexStringOrEmptyRegex = /^(?:[\da-f]{24})?$/;
const objectIdHexStringRegex = /^[\da-f]{24}$/;

// Functions
export const objectId = () => objectIdString().transform((value) => new Types.ObjectId(value));

export function objectIdOrEmptyString() {
    return z
        .string()
        .toLowerCase()
        .regex(objectIdHexStringOrEmptyRegex, 'Invalid ObjectId or empty string')
        .meta({ format: 'objectid' })
        .transform((value) => value === '' ? value : new Types.ObjectId(value));
}

export function objectIdString() {
    return z
        .string()
        .toLowerCase()
        .regex(objectIdHexStringRegex, 'Invalid ObjectId')
        .meta({ format: 'objectid' });
}
