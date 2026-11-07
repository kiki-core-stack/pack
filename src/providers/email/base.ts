import { cloneDeep } from 'es-toolkit';
import type { Promisable } from 'type-fest';

import type { EmailProviderCode } from '../../constants/email';
import type { EmailSendRecord } from '../../models/email/send-record';
import type { EmailProviderConfigByCode } from '../../types/email';

import type { LeanedEmailProvider } from './';

export abstract class BaseEmailProvider<C extends EmailProviderCode> {
    protected readonly apiProxyUrl?: string;
    protected readonly config: EmailProviderConfigByCode[C];

    constructor(provider: LeanedEmailProvider) {
        this.apiProxyUrl = provider.apiProxyUrl;
        // Keep the assertion; provider configs are only assignable while every code shares one shape.
        // eslint-disable-next-line ts/no-unnecessary-type-assertion
        this.config = cloneDeep(provider.config) as EmailProviderConfigByCode[C];
    }

    // Public methods
    abstract close(): Promisable<void>;
    abstract sendEmail(sendRecord: EmailSendRecord, signal?: AbortSignal): Promise<{ transactionId?: string }>;
}
