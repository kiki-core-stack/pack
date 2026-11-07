import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type {
    EmailSenderIdentityKey,
    EmailSendRecordStatus,
} from '../../constants/email';
import type { EmailProviderConfigVariant } from '../email';

import type { WithAdminAuditData } from './';

export type EmailProviderData = EmailProviderBaseData & EmailProviderConfigVariant;

export interface EmailProviderBaseData extends BaseMongooseModelData, WithAdminAuditData {
    apiProxyUrl?: string;
    cacheKey: string;
    enabled: boolean;
    name: string;
    priority: number;
}

export interface EmailSenderIdentityData extends BaseMongooseModelData, WithAdminAuditData {
    enabled: boolean;
    from: string;
    key: EmailSenderIdentityKey;
}

export interface EmailSendRecordData extends BaseMongooseModelData {
    attemptId?: string;
    content: string;
    failureReason?: string;
    from: string;
    provider?: Partial<EmailProviderData>;
    providerTransactionId?: string;
    status: EmailSendRecordStatus;
    subject: string;
    to: string;
}
