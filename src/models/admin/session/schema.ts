import * as s from '@kikiutils/mongoose/schema-builders';
import { Schema } from 'mongoose';

import { mongooseRefSchemas } from '@/constants/mongoose';

import type {
    AdminSession,
    AdminSessionMethodsAndOverrides,
    AdminSessionModel,
} from './types';

export const adminSessionSchema = new Schema<AdminSession, AdminSessionModel, AdminSessionMethodsAndOverrides>({
    a: mongooseRefSchemas.admin.required,
    lastActiveAt: s.date().required,
    lastActiveIp: s.string().trim.required,
    loginIp: s.string().trim.required,
    token: s.string().private.trim.unique.required,
    userAgent: s.string().trim.nonRequired,
});
