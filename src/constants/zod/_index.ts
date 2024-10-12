import { Types } from 'mongoose';
import { z as _z } from 'zod';

export * from 'zod/lib/external';

export const objectId = () => _z.custom<string>((value) => Types.ObjectId.isValid(value), { message: 'Invalid ObjectId' });
export const objectIdOrEmptyString = () => _z.custom<string>((value) => !value || Types.ObjectId.isValid(value), { message: 'Invalid ObjectId or empty string' });
export const telegramSuperGroupI = () => _z.custom<string>((value) => /^-100[0-9]{10}$/.test(value), { message: 'Invalid Telegram Super Group ID' });
