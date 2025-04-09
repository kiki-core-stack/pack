import {
    number,
    string,
} from '@kikiutils/mongoose/schema-builders';
import { getEnumNumberValues } from '@kikiutils/node/enum';
import { Schema } from 'mongoose';

import { AdminLogType } from '@/constants/admin';
import {
    mongooseRefSchemas,
    schemaTimestampsConfigOnlyCreatedAt,
} from '@/constants/mongoose';

import type {
    AdminLog,
    AdminLogModel,
} from './types';

export const adminLogSchema = new Schema<AdminLog, AdminLogModel>(
    {
        a: mongooseRefSchemas.admin.required,
        fingerprint: string().trim.nonRequired,
        ip: string().trim.nonRequired,
        note: string().trim.nonRequired,
        type: number().enum(getEnumNumberValues(AdminLogType)).required,
    },
    { timestamps: schemaTimestampsConfigOnlyCreatedAt },
);
