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
    config: AnyRecord;
    configHash: string;
    enabled: boolean;
    name: string;
    priority: number;
    providerCode: EmailProviderCode;
}

export interface EmailSenderIdentityData extends BaseMongooseModelData, WithAdminAuditData {
    enabled: boolean;
    from: string;
    key: EmailSenderIdentityKey;
}

export interface EmailSendRecordData extends BaseMongooseModelData {
    content: string;
    failureReason?: string;
    from: string;
    provider?: Partial<EmailProviderData>;
    providerTransactionId?: string;
    status: EmailSendRecordStatus;
    subject: string;
    to: string;
}
