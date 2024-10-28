import { Types } from 'mongoose';
import { z as _z } from 'zod';

export * from 'zod';

export const objectId = () => _z.string().refine((value) => Types.ObjectId.isValid(value), { message: 'Invalid ObjectId' });
export const objectIdOrEmptyString = () => _z.string().refine((value) => !value || Types.ObjectId.isValid(value), { message: 'Invalid ObjectId or empty string' });
export const telegramSuperGroupId = () => _z.string().refine((value) => /^-100[\d]{10}$/.test(value), { message: 'Invalid Telegram Super Group Id' });
