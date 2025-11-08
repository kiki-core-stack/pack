import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';
import type { AnyRecord } from '@kikiutils/shared/types';

import type {
    EmailSendRecordStatus,
    EmailServiceProvider,
} from '../../constants/email';

import type { WithAdminAuditData } from './';

export interface EmailPlatformData extends BaseMongooseModelData, WithAdminAuditData {
    config: AnyRecord;
    configMd5: string;
    enabled: boolean;
    name: string;
    priority: number;
    serviceProvider: EmailServiceProvider;
}

export interface EmailSendRecordData extends BaseMongooseModelData {
    content: string;
    failureReason?: string;
    from: string;
    platform?: Partial<EmailPlatformData>;
    sentAt?: string;
    serviceProviderTransactionId?: string;
    status: EmailSendRecordStatus;
    subject: string;
    to: string;
}
