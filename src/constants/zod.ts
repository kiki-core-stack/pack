import { Types } from 'mongoose';
import { z as _z } from 'zod';

export const z = {
	..._z,
	objectId: () => z.custom<string>((value) => Types.ObjectId.isValid(value), { message: 'Invalid ObjectId' }),
	objectIdOrEmptyString: () => z.custom<string>((value) => !value || Types.ObjectId.isValid(value), { message: 'Invalid ObjectId or empty string' }),
	telegramSuperGroupId: () => z.custom<string>((value) => /^-100[0-9]{10}$/.test(value), { message: 'Invalid Telegram Super Group ID' })
};
