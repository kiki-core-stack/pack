import type { DataToBaseMongooseDocType } from '@kikiutils/mongoose/types/data';

import type * as z from '../../libs/zod';
import type {
    apiValidationIssueSchema,
    duplicateKeyErrorDataSchema,
    validationFailedErrorDataSchema,
} from '../../schemas/api';

import type { AdminData } from './admin';

export type ApiResponseData<D extends object | undefined = undefined, E extends string = string> =
  | ApiErrorResponseData<E>
  | ApiSuccessResponseData<D>;

export type ApiValidationIssue = z.output<typeof apiValidationIssueSchema>;

/**
 * Error codes a client synthesizes when no API error response exists.
 *
 * - `aborted`: the request was canceled (e.g. superseded by a newer one); never shown to the user.
 * - `networkError`: no response was received (offline, DNS, timeout, CORS...).
 */
export type ClientApiErrorCode = 'aborted' | 'networkError';

export type DuplicateKeyErrorData = z.output<typeof duplicateKeyErrorDataSchema>;

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

export type ValidationFailedErrorData = z.output<typeof validationFailedErrorDataSchema>;

export interface ApiErrorResponseData<E extends string = string, D = unknown> {
    /**
     * Always absent on failures, so `data` is present only on success; error details are in `errorData`.
     */
    data?: undefined;
    errorCode: E;
    errorData?: D;

    /**
     * Message of the error code in the request's locale (`Accept-Language`), ready to show to users.
     */
    message: string;
    requestId?: string;
    success: false;
}

export interface ApiSuccessResponseData<D extends object | undefined = undefined> {
    data?: D;
    message?: string;
    success: true;
}

/**
 * `errorData` of the common API errors that carry it, keyed by error code.
 */
export interface CommonApiErrorDataMap {
    duplicateKey: DuplicateKeyErrorData;
    validationFailed: ValidationFailedErrorData;
}

export interface TableRowData {
    id: string;
}

export interface WithAdminAuditData {
    createdByAdmin: Partial<AdminData>;
    editedByAdmin?: Partial<AdminData>;
}
