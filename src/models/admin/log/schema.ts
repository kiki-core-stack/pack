import s from '@kikiutils/mongoose/schema-builders';
import { getEnumNumberValues } from '@kikiutils/node/enum';
import { Schema } from 'mongoose';

import { AdminLogType } from '@/constants/admin';
import { mongooseRefSchemas } from '@/constants/mongoose';

import type {
    AdminLog,
    AdminLogModel,
} from './types';

export const adminLogSchema = new Schema<AdminLog, AdminLogModel>(
    {
        admin: mongooseRefSchemas.admin.required,
        content: s.string().trim.nonRequired,
        fingerprint: s.string().trim.nonRequired,
        ip: s.string().trim.nonRequired,
        type: s.number().enum(getEnumNumberValues(AdminLogType)).required,
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    },
);
