import type { Types } from 'mongoose';

import type { AdminSessionData } from '../../../types/data/admin';

export type AdminSessionDocument = MongooseHydratedDocument<AdminSession, AdminSessionMethodsAndOverrides>;
export type AdminSessionModel = BaseMongoosePaginateModel<AdminSession, AdminSessionMethodsAndOverrides>;

export interface AdminSession extends BaseMongooseDocType<Except<AdminSessionData, 'a' | 'lastActiveAt'>> {
    a: Types.ObjectId;
    lastActiveAt: Date;
}

export interface AdminSessionMethodsAndOverrides {
    token: string;
}
