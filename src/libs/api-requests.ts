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
export const deleteApi = <T extends object = object>(url: string, params?: ApiRequestParams, config?: AxiosRequestConfig) => requestApi<T>(url, 'delete', params, {}, config);
export const $deleteApi = async <T extends object = object>(url: string, params?: ApiRequestParams, config?: AxiosRequestConfig) => (await deleteApi<T>(url, params, config))?.data;
export const getApi = <T extends object = object>(url: string, params?: ApiRequestParams, config?: AxiosRequestConfig) => requestApi<T>(url, 'get', params, {}, config);
export const $getApi = async <T extends object = object>(url: string, params?: ApiRequestParams, config?: AxiosRequestConfig) => (await getApi<T>(url, params, config))?.data;
export const patchApi = <T extends object = object>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => requestApi<T>(url, 'patch', {}, data, config);
export const $patchApi = async <T extends object = object>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => (await patchApi<T>(url, data, config))?.data;
export const postApi = <T extends object = object>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => requestApi<T>(url, 'post', {}, data, config);
export const $postApi = async <T extends object = object>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => (await postApi<T>(url, data, config))?.data;
export const putApi = <T extends object = object>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => requestApi<T>(url, 'put', {}, data, config);
export const $putApi = async <T extends object = object>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => (await putApi<T>(url, data, config))?.data;

export function requestApi<T extends object = object, R extends AxiosResponse<ApiResponseData<T>> | undefined = AxiosResponse<ApiResponseData<T>> | undefined, D extends ApiRequestData = any>(url: string, method: Method, params?: ApiRequestData, data?: D, config?: AxiosRequestConfig) {
    return apiInstance.request<T, R, D>({
        ...config,
        data,
        method,
        params,
        url,
    });
}
