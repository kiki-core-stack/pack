import type { AdminData } from '@/types/data/admin';

export type Admin = BaseMongooseDocType<AdminData>;
export type AdminDocument = MongooseHydratedDocument<Admin, AdminMethodsAndOverrides>;
export type AdminModel = BaseMongoosePaginateModel<Admin, AdminMethodsAndOverrides>;

export interface AdminMethodsAndOverrides {
    password: string;
    verifyPassword: (password: string) => boolean;
}
