import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';

export { AxiosError } from 'axios';

export type ApiRequestData = FormData | ApiRequestParams;
export type ApiRequestParams = Dict<any>;

export const apiInstance: AxiosInstance = axios.create({ baseURL: process.env.BASE_URL ?? '/api' });
export const requestApi = async <T extends object = {}, R extends AxiosResponse<ApiResponseData<T>> = AxiosResponse<ApiResponseData<T>>, D extends ApiRequestData = any>(
	url: string,
	method: Method,
	params?: ApiRequestData,
	data?: D,
	config?: AxiosRequestConfig
) => await apiInstance.request<T, R, D>({ ...config, data, method, params, url });

export const deleteApi = async <T extends object = {}>(url: string, params?: ApiRequestParams, config?: AxiosRequestConfig) => await requestApi<T>(url, 'delete', params, {}, config);
export const $deleteApi = async <T extends object = {}>(url: string, params?: ApiRequestParams, config?: AxiosRequestConfig) => (await deleteApi<T>(url, params, config)).data;
export const getApi = async <T extends object = {}>(url: string, params?: ApiRequestParams, config?: AxiosRequestConfig) => await requestApi<T>(url, 'get', params, {}, config);
export const $getApi = async <T extends object = {}>(url: string, params?: ApiRequestParams, config?: AxiosRequestConfig) => (await getApi<T>(url, params, config)).data;
export const patchApi = async <T extends object = {}>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => await requestApi<T>(url, 'patch', {}, data, config);
export const $patchApi = async <T extends object = {}>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => (await patchApi<T>(url, data, config)).data;
export const postApi = async <T extends object = {}>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => await requestApi<T>(url, 'post', {}, data, config);
export const $postApi = async <T extends object = {}>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => (await postApi<T>(url, data, config)).data;
export const putApi = async <T extends object = {}>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => await requestApi<T>(url, 'put', {}, data, config);
export const $putApi = async <T extends object = {}>(url: string, data?: ApiRequestData, config?: AxiosRequestConfig<ApiRequestData>) => (await putApi<T>(url, data, config)).data;
