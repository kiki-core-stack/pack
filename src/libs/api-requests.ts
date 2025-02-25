import axios from 'axios';
import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    Method,
} from 'axios';

export { AxiosError } from 'axios';

export type APIRequestData = APIRequestParams | FormData;
export type APIRequestParams = Dict<any>;

export const apiInstance: AxiosInstance = axios.create();
export const deleteAPI = <T extends object = object>(url: string, params?: APIRequestParams, config?: AxiosRequestConfig) => requestAPI<T>(url, 'delete', params, {}, config);
export const $deleteAPI = async <T extends object = object>(url: string, params?: APIRequestParams, config?: AxiosRequestConfig) => (await deleteAPI<T>(url, params, config))?.data;
export const getAPI = <T extends object = object>(url: string, params?: APIRequestParams, config?: AxiosRequestConfig) => requestAPI<T>(url, 'get', params, {}, config);
export const $getAPI = async <T extends object = object>(url: string, params?: APIRequestParams, config?: AxiosRequestConfig) => (await getAPI<T>(url, params, config))?.data;
export const patchAPI = <T extends object = object>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => requestAPI<T>(url, 'patch', {}, data, config);
export const $patchAPI = async <T extends object = object>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => (await patchAPI<T>(url, data, config))?.data;
export const postAPI = <T extends object = object>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => requestAPI<T>(url, 'post', {}, data, config);
export const $postAPI = async <T extends object = object>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => (await postAPI<T>(url, data, config))?.data;
export const putAPI = <T extends object = object>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => requestAPI<T>(url, 'put', {}, data, config);
export const $putAPI = async <T extends object = object>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => (await putAPI<T>(url, data, config))?.data;

export function requestAPI<T extends object = object, R extends AxiosResponse<APIResponseData<T>> | undefined = AxiosResponse<APIResponseData<T>> | undefined, D extends APIRequestData = any>(url: string, method: Method, params?: APIRequestData, data?: D, config?: AxiosRequestConfig) {
    return apiInstance.request<T, R, D>({
        ...config,
        data,
        method,
        params,
        url,
    });
}
