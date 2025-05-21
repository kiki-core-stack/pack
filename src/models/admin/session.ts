import * as s from '@kikiutils/mongoose/schema-builders';
import { buildMongooseModel } from '@kikiutils/mongoose/utils';
import { Schema } from 'mongoose';
import type { Types } from 'mongoose';

import { mongooseRefSchemas } from '../../constants/mongoose';
import type { AdminSessionData } from '../../types/data/admin';

export type AdminSessionDocument = MongooseHydratedDocument<AdminSession, AdminSessionMethodsAndOverrides>;
type AdminSessionModel = BaseMongoosePaginateModel<AdminSession, AdminSessionMethodsAndOverrides>;

export interface AdminSession extends BaseMongooseDocType<Except<AdminSessionData, 'a' | 'lastActiveAt'>> {
    a: Types.ObjectId;
    lastActiveAt: Date;
}

interface AdminSessionMethodsAndOverrides {
    token: string;
}

const schema = new Schema<AdminSession, AdminSessionModel, AdminSessionMethodsAndOverrides>({
    a: mongooseRefSchemas.admin.required,
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
