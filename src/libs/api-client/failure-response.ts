import axios from 'axios';
import type {
    AxiosError,
    AxiosResponse,
} from 'axios';

import type { ApiErrorResponseData } from '../../types/api';
import type { ApiClientFailureResponseData } from '../../types/api-client';

export type ApiClientFailureMessageKey = 'aborted' | 'invalidResponse' | 'networkError';

// Functions

/**
 * Whether `data` is an API error envelope.
 */
export function isApiErrorResponseData(data: unknown): data is ApiErrorResponseData {
    return typeof data === 'object'
      && data !== null
      && (data as ApiErrorResponseData).success === false
      && typeof (data as ApiErrorResponseData).errorCode === 'string';
}

/**
 * Parses a JSON `Blob` body (an error of a request with `responseType: 'blob'`, e.g. a file download) so it can be
 * read as the API envelope; other data is returned as is.
 */
async function parseBlobJsonData(data: unknown) {
    if (!(data instanceof Blob) || !data.type.includes('json')) return data;
    try {
        return JSON.parse(await data.text());
    } catch {
        return data;
    }
}

/**
 * Turns a failed request into a response whose `data` is an API error envelope, for a response interceptor to return
 * instead of rejecting.
 *
 * HTTP errors keep their response (with a fallback `internalServerError` envelope when the body is not one, e.g. a
 * proxy error page); failures without a response are synthesized with status 0 as `aborted` or `networkError`.
 * `getMessage` provides the app's own messages of the synthesized envelopes.
 */
export async function toApiClientFailureResponse(
    error: AxiosError,
    getMessage: (key: ApiClientFailureMessageKey) => string,
): Promise<AxiosResponse<ApiClientFailureResponseData | ApiErrorResponseData>> {
    let response: AxiosResponse<ApiClientFailureResponseData | ApiErrorResponseData>;
    if (error.response) {
        const data = await parseBlobJsonData(error.response.data);
        response = {
            ...error.response,
            data: isApiErrorResponseData(data)
                ? data
                : {
                    errorCode: 'internalServerError',
                    message: getMessage('invalidResponse'),
                    success: false,
                },
        };
    } else {
        const errorCode = axios.isCancel(error) ? 'aborted' : 'networkError';
        response = {
            config: error.config!,
            data: {
                errorCode,
                message: getMessage(errorCode),
                success: false,
            },
            headers: {},
            status: 0,
            statusText: '',
        };
    }

    response.error = error;
    return response;
}
