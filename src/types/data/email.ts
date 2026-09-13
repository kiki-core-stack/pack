import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';
import type { AnyRecord } from '@kikiutils/shared/types';

import type {
    EmailProviderCode,
    EmailSenderIdentityKey,
    EmailSendRecordStatus,
} from '../../constants/email';

import type { WithAdminAuditData } from './';

export interface EmailProviderData extends BaseMongooseModelData, WithAdminAuditData {
    apiProxyUrl?: string;
    cacheKey: string;
    code: EmailProviderCode;
    config: AnyRecord;
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
