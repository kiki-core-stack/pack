import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios';

export { AxiosError } from 'axios';

export type APIRequestData = FormData | APIRequestParams;
export type APIRequestParams = Dict<any>;

export const apiInstance: AxiosInstance = axios.create();
export const requestAPI = async <T extends object = {}, R extends AxiosResponse<APIResponseData<T>> | undefined = AxiosResponse<APIResponseData<T>> | undefined, D extends APIRequestData = any>(
	url: string,
	method: Method,
	params?: APIRequestData,
	data?: D,
	config?: AxiosRequestConfig
) => await apiInstance.request<T, R, D>({ ...config, data, method, params, url });

export const deleteAPI = async <T extends object = {}>(url: string, params?: APIRequestParams, config?: AxiosRequestConfig) => await requestAPI<T>(url, 'delete', params, {}, config);
export const $deleteAPI = async <T extends object = {}>(url: string, params?: APIRequestParams, config?: AxiosRequestConfig) => (await deleteAPI<T>(url, params, config))?.data;
export const getAPI = async <T extends object = {}>(url: string, params?: APIRequestParams, config?: AxiosRequestConfig) => await requestAPI<T>(url, 'get', params, {}, config);
export const $getAPI = async <T extends object = {}>(url: string, params?: APIRequestParams, config?: AxiosRequestConfig) => (await getAPI<T>(url, params, config))?.data;
export const patchAPI = async <T extends object = {}>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => await requestAPI<T>(url, 'patch', {}, data, config);
export const $patchAPI = async <T extends object = {}>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => (await patchAPI<T>(url, data, config))?.data;
export const postAPI = async <T extends object = {}>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => await requestAPI<T>(url, 'post', {}, data, config);
export const $postAPI = async <T extends object = {}>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => (await postAPI<T>(url, data, config))?.data;
export const putAPI = async <T extends object = {}>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => await requestAPI<T>(url, 'put', {}, data, config);
export const $putAPI = async <T extends object = {}>(url: string, data?: APIRequestData, config?: AxiosRequestConfig<APIRequestData>) => (await putAPI<T>(url, data, config))?.data;
