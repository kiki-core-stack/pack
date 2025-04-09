import {
    date,
    string,
} from '@kikiutils/mongoose/schema-builders';
import { Schema } from 'mongoose';

import { mongooseRefSchemas } from '@/constants/mongoose';

import type {
    AdminSession,
    AdminSessionMethodsAndOverrides,
    AdminSessionModel,
} from './types';

export const adminSessionSchema = new Schema<AdminSession, AdminSessionModel, AdminSessionMethodsAndOverrides>({
    a: mongooseRefSchemas.admin.required,
    lastActiveAt: date().required,
    lastActiveIp: string().trim.required,
    loginIp: string().trim.required,
    token: string().private.trim.unique.required,
    userAgent: string().trim.nonRequired,
});
