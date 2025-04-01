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

export function deleteApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    params?: ApiRequestParams,
    config?: AxiosRequestConfig,
) {
    return requestApi<T, E>(url, 'delete', params, {}, config);
}

export async function $deleteApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    params?: ApiRequestParams,
    config?: AxiosRequestConfig,
) {
    return (await deleteApi<T, E>(url, params, config))?.data;
}

export function getApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    params?: ApiRequestParams,
    config?: AxiosRequestConfig,
) {
    return requestApi<T, E>(url, 'get', params, {}, config);
}

export async function $getApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    params?: ApiRequestParams,
    config?: AxiosRequestConfig,
) {
    return (await getApi<T, E>(url, params, config))?.data;
}

export function patchApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return requestApi<T, E>(url, 'patch', {}, data, config);
}

export async function $patchApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return (await patchApi<T, E>(url, data, config))?.data;
}

export function postApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return requestApi<T, E>(url, 'post', {}, data, config);
}

export async function $postApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return (await postApi<T, E>(url, data, config))?.data;
}

export function putApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return requestApi<T, E>(url, 'put', {}, data, config);
}

export async function $putApi<T extends object | undefined = undefined, E extends string | undefined = undefined>(
    url: string,
    data?: ApiRequestData,
    config?: AxiosRequestConfig<ApiRequestData>,
) {
    return (await putApi<T, E>(url, data, config))?.data;
}

export function requestApi<
    T extends object | undefined = undefined,
    E extends string | undefined = undefined,
    R extends AxiosResponse<ApiResponseData<T, E>> | undefined = AxiosResponse<ApiResponseData<T, E>> | undefined,
    D extends ApiRequestData = any,
>(
    url: string,
    method: Method,
    params?: ApiRequestData,
    data?: D,
    config?: AxiosRequestConfig<D>,
) {
    return apiInstance.request<T, R, D>({
        ...config,
        data,
        method,
        params,
        url,
    });
}
