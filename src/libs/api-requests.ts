import axios from 'axios';
import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    Method,
} from 'axios';

export { AxiosError } from 'axios';

export type ApiRequestData = ApiRequestParams | FormData;
export type ApiRequestParams = Dict<any>;

export const apiInstance: AxiosInstance = axios.create();

export function deleteApi<T extends object = object>(
    url: string,
    params?: ApiRequestParams,
    config?: AxiosRequestConfig,
) {
    return requestApi<T>(url, 'delete', params, {}, config);
}

export async function $deleteApi<T extends object = object>(
    url: string,
    params?: ApiRequestParams,
    config?: AxiosRequestConfig,
) {
    return (await deleteApi<T>(url, params, config))?.data;
}

export function getApi<T extends object = object>(
    url: string,
    params?: ApiRequestParams,
    config?: AxiosRequestConfig,
) {
    return requestApi<T>(url, 'get', params, {}, config);
}

export async function $getApi<T extends object = object>(
    url: string,
    params?: ApiRequestParams,
    config?: AxiosRequestConfig,
) {
    return (await getApi<T>(url, params, config))?.data;
}

export function patchApi<T extends object = object>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return requestApi<T>(url, 'patch', {}, data, config);
}

export async function $patchApi<T extends object = object>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return (await patchApi<T>(url, data, config))?.data;
}

export function postApi<T extends object = object>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return requestApi<T>(url, 'post', {}, data, config);
}

export async function $postApi<T extends object = object>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return (await postApi<T>(url, data, config))?.data;
}

export function putApi<T extends object = object>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return requestApi<T>(url, 'put', {}, data, config);
}

export async function $putApi<T extends object = object>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return (await putApi<T>(url, data, config))?.data;
}

export function requestApi<
    T extends object = object,
    R extends AxiosResponse<ApiResponseData<T>> | undefined = AxiosResponse<ApiResponseData<T>> | undefined,
    D extends ApiRequestData = any,
>(
    url: string,
    method: Method,
    params?: ApiRequestData,
    data?: D,
    config?: AxiosRequestConfig,
) {
    return apiInstance.request<T, R, D>({
        ...config,
        data,
        method,
        params,
        url,
    });
}
