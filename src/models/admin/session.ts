import * as s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { Schema } from 'mongoose';

import { mongooseRefSchemas } from '../../constants/mongoose';
import type { AdminSessionData } from '../../types/data/admin';

export type AdminSession = SmartDataToBaseMongooseDocType<AdminSessionData, 'admin', 'lastActiveAt'>;
export type AdminSessionDocument = MongooseHydratedDocument<AdminSession, AdminSessionMethodsAndOverrides>;
type AdminSessionModel = BaseMongoosePaginateModel<AdminSession, AdminSessionMethodsAndOverrides>;

interface AdminSessionMethodsAndOverrides {
    token: string;
}

const schema = new Schema<AdminSession, AdminSessionModel, AdminSessionMethodsAndOverrides>({
    admin: mongooseRefSchemas.admin.required,
    lastActiveAt: s.date().required,
    lastActiveIp: s.string().trim.required,
    loginIp: s.string().trim.required,
    token: s.string().private.trim.unique.required,
    userAgent: s.string().trim.nonRequired,
});

export const AdminSessionModel = buildMongooseModel<AdminSession, AdminSessionModel, AdminSessionMethodsAndOverrides>(
    'admin.sessions',
    'AdminSession',
    schema,
);
