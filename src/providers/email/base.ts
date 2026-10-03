import type { Promisable } from 'type-fest';

import type { EmailSendRecord } from '../../models/email/send-record';
import type { EmailProviderConfig } from '../../types/email';

import type { LeanedEmailProvider } from './';

export abstract class BaseEmailProvider<C extends EmailProviderConfig> {
    protected readonly apiProxyUrl?: string;
    protected readonly config: C;

    constructor(provider: LeanedEmailProvider) {
        this.apiProxyUrl = provider.apiProxyUrl;
        this.config = provider.config as C;
    }

    // Public methods
    abstract close(): Promisable<void>;
    abstract sendEmail(sendRecord: EmailSendRecord, signal?: AbortSignal): Promise<{ transactionId?: string }>;
}
