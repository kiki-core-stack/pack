import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { cloneDeep } from 'es-toolkit';

import type { SmsProviderCode } from '../../constants/sms';
import type { SmsSendRecord } from '../../models/sms/send-record';
import type { SmsProviderConfigByCode } from '../../types/sms';
import type { AxiosProxyAgents } from '../utils/axios';
import { createAxiosProxyAgentOptions } from '../utils/axios';

import type { LeanedSmsProvider } from './';

export abstract class BaseSmsProvider<C extends SmsProviderCode> {
    readonly #axiosProxyAgents: AxiosProxyAgents;

    protected readonly axiosInstance: AxiosInstance;
    protected readonly config: SmsProviderConfigByCode[C];

    constructor(provider: LeanedSmsProvider) {
        // Keep the assertion; provider configs are only assignable while every code shares one shape.
        // eslint-disable-next-line ts/no-unnecessary-type-assertion
        this.config = cloneDeep(provider.config) as SmsProviderConfigByCode[C];
        this.#axiosProxyAgents = createAxiosProxyAgentOptions(provider.apiProxyUrl);
        this.axiosInstance = axios.create({
            baseURL: this.config.apiUrl,
            proxy: false,
            ...this.#axiosProxyAgents,
        });
    }

    // Public methods
    close() {
        this.#axiosProxyAgents.httpAgent?.destroy();
        this.#axiosProxyAgents.httpsAgent?.destroy();
    }

    abstract sendSms(sendRecord: SmsSendRecord, signal?: AbortSignal): Promise<{ transactionId?: string }>;
}
