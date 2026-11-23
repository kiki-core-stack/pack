import type * as z from '../libs/zod';
import type {
    apiValidationIssueSchema,
    authVerificationRequiredErrorDataSchema,
    duplicateKeyErrorDataSchema,
    validationFailedErrorDataSchema,
} from '../schemas/api';

/**
 * Failures a client gives its own message to (pack `apiClientErrors`): its synthesized codes, plus `invalidResponse`
 * for a response that is not an API envelope.
 */
export type ApiClientFailureMessageKey = 'invalidResponse' | ClientApiErrorCode;
export type ApiResponseData<D extends object | undefined = undefined, E extends string = string> =
  | ApiErrorResponseData<E>
  | ApiSuccessResponseData<D>;

export type ApiValidationIssue = z.output<typeof apiValidationIssueSchema>;
export type AuthVerificationRequiredErrorData = z.output<typeof authVerificationRequiredErrorDataSchema>;

/**
 * Error codes a client synthesizes when no API error response exists.
 *
 * - `aborted`: the request was canceled (e.g. superseded by a newer one); never shown to the user.
 * - `networkError`: no response was received (offline, DNS, timeout, CORS...).
 */
export type ClientApiErrorCode = 'aborted' | 'networkError';
export type DuplicateKeyErrorData = z.output<typeof duplicateKeyErrorDataSchema>;
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
    success: true;
}

/**
 * `errorData` of the auth API errors that carry it, keyed by error code.
 */
export interface AuthApiErrorDataMap {
    verificationRequired: AuthVerificationRequiredErrorData;
}

/**
 * `errorData` of the common API errors that carry it, keyed by error code.
 */
export interface CommonApiErrorDataMap {
    duplicateKey: DuplicateKeyErrorData;
    validationFailed: ValidationFailedErrorData;
}
