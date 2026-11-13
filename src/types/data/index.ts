import type { DataToBaseMongooseDocType } from '@kikiutils/mongoose/types/data';
import type { UnknownRecord } from 'type-fest';

import type { AdminData } from './admin';

export type ApiResponseData<D extends object | undefined = undefined, E extends string = string> =
  | ApiErrorResponseData<E>
  | ApiSuccessResponseData<D>;

/**
 * Error codes a client synthesizes when no API error response exists.
 *
 * - `aborted`: the request was canceled (e.g. superseded by a newer one); never shown to the user.
 * - `networkError`: no response was received (offline, DNS, timeout, CORS...).
 */
export type ClientApiErrorCode = 'aborted' | 'networkError';

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
    /**
     * Always absent on failures, so `data` is present only on success; error details are in `errorData`.
     */
    data?: undefined;
    errorCode: E;
    errorData?: D;
    message?: string;
    requestId?: string;
    success: false;
}

export interface ApiSuccessResponseData<D extends object | undefined = undefined> {
    data?: D;
    message?: string;
    success: true;
}

export interface ApiValidationIssue {
    code?: string;

    /**
     * The schema issue's own fields (Zod: `expected`, `origin`, `minimum`, `maximum`, `inclusive`, `format`,
     * `pattern`, `values`, `params`...), so clients can translate the issue by `code`, e.g. with a Zod locale.
     * Never includes the input.
     */
    details?: UnknownRecord;

    /**
     * Server-side message (English); clients should translate by `code` and `details` instead.
     */
    message: string;
    path: Array<number | string>;
}

export interface TableRowData {
    id: string;
}

export interface WithAdminAuditData {
    createdByAdmin: Partial<AdminData>;
    editedByAdmin?: Partial<AdminData>;
}
