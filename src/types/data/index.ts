import type { DataToBaseMongooseDocType } from '@kikiutils/mongoose/types/data';
import type { UnknownRecord } from 'type-fest';

import type { AdminData } from './admin';

type EffectiveObjectIdFields<
    T,
    O extends keyof T,
> = Extract<keyof T, keyof WithAdminAuditData> extends never
    ? O
    : Extract<keyof WithAdminAuditData | O, keyof T>;

export type SmartDataToBaseMongooseDocType<
    T,
    ObjectIdFields extends Exclude<keyof T, keyof WithAdminAuditData> = never,
    DateFields extends Exclude<keyof T, EffectiveObjectIdFields<T, ObjectIdFields>> = never,
> = DataToBaseMongooseDocType<
    T,
    EffectiveObjectIdFields<T, ObjectIdFields>,
    DateFields,
    T extends { createdAt: string } ? true : false,
    T extends { updatedAt: string } ? true : false
>;

export interface ApiErrorResponseData<E extends string = string, D = unknown> {
    data?: D;
    errorCode: E;
    message?: string;
    requestId?: string;
    success: false;
}

export interface ApiResponseData<D extends object | undefined = undefined, E extends string | undefined = undefined> {
    data?: D;
    errorCode?: E;
    message?: string;
    success: boolean;
}

export interface ApiSuccessResponseData<D extends object | undefined = undefined> {
    data?: D;
    message?: string;
    success: true;
}

export interface ApiValidationIssue {
    code?: string;
    message: string;
    params?: UnknownRecord;
    path: Array<number | string>;
}

export interface TableRowData {
    id: string;
}

export interface WithAdminAuditData {
    createdByAdmin: Partial<AdminData>;
    editedByAdmin?: Partial<AdminData>;
}
