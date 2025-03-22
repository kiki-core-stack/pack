import s from '@kikiutils/mongoose/schema-builders';
import { Schema } from 'mongoose';

import { mongooseRefSchemas } from '@/constants/mongoose';

import type {
    AdminSession,
    AdminSessionModel,
} from './types';

export const adminSessionSchema = new Schema<AdminSession, AdminSessionModel>({
    admin: mongooseRefSchemas.admin.required,
    lastActiveAt: s.date().required,
    token: s.string().trim.unique.required,
    userAgent: s.string().trim.required,
});
