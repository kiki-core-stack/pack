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
export const commonAjvValidatorSchemas = {
	boolean: { nonRequired: { nullable: true, type: 'boolean' }, required: { type: 'boolean' } },
	email: {
		nonRequired: {
			format: 'email',
			nullable: true,
			transform: ['toLowerCase', 'trim'],
			type: 'string'
		},
		required: {
			format: 'email',
			transform: ['toLowerCase', 'trim'],
			type: 'string'
		}
	},
	number: { nonRequired: { nullable: true, type: 'number' }, required: { type: 'number' } },
	objectId: {
		nonRequired: {
			format: 'objectId',
			nullable: true,
			transform: ['trim'],
			type: 'string'
		},
		required: {
			format: 'objectId',
			transform: ['trim'],
			type: 'string'
		}
	},
	objectIdOrEmptyString: {
		nonRequired: {
			format: 'objectIdOrEmptyString',
			nullable: true,
			transform: ['trim'],
			type: 'string'
		},
		required: {
			format: 'objectIdOrEmptyString',
			transform: ['trim'],
			type: 'string'
		}
	},
	string: {
		nonRequired: { nullable: true, type: 'string' },
		required: { type: 'string' },
		short: {
			nonRequired: {
				maxLength: 16,
				nullable: true,
				type: 'string'
			},
			required: { maxLength: 16, type: 'string' },
			trimmed: {
				nonRequired: {
					maxLength: 16,
					nullable: true,
					transform: ['trim'],
					type: 'string'
				},
				required: {
					maxLength: 16,
					transform: ['trim'],
					type: 'string'
				}
			}
		},
		trimmed: {
			nonRequired: {
				nullable: true,
				transform: ['trim'],
				type: 'string'
			},
			required: { transform: ['trim'], type: 'string' }
		}
	}
} as const;
