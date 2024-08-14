import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addKeywords from 'ajv-keywords';
import { Types } from 'mongoose';

export const ajvValidator = new Ajv({
	allowUnionTypes: true,
	coerceTypes: true,
	removeAdditional: true
});

addFormats(ajvValidator);
addKeywords(ajvValidator);
ajvValidator.addFormat('objectId', { type: 'string', validate: (value) => Types.ObjectId.isValid(value) });
ajvValidator.addFormat('objectIdOrEmptyString', { type: 'string', validate: (value) => !value || Types.ObjectId.isValid(value) });
ajvValidator.addFormat('telegramSuperGroupId', { type: 'string', validate: (value) => value.match(/^-100[0-9]{10}$/) !== null });
