import type { AxiosResponse } from 'axios';

import type {
    ApiErrorResponseData,
    ClientApiErrorCode,
} from './api';

/**
 * Error envelopes a client synthesizes itself: request failures without a response (`aborted`, `networkError`) and
 * responses whose body is not an API envelope (`internalServerError`, e.g. a proxy error page).
 */
export type ApiClientFailureResponseData = ApiErrorResponseData<'internalServerError' | ClientApiErrorCode>;

/**
 * Promise of an API client call: it never rejects for request failures, so `response.data` is always an API envelope
 * (`T`, the documented responses of the route) or one synthesized by the client.
 */
export type ApiClientPromise<T = unknown> = Promise<ApiClientResponse<T>>;
export type ApiClientResponse<T = unknown> = AxiosResponse<ApiClientFailureResponseData | T>;

declare module 'axios' {
    interface AxiosResponse {
        /**
         * The original error, present only on failures (HTTP errors and client-synthesized responses).
         */
        error?: AxiosError;
    }
}
