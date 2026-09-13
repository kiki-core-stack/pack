import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';
import type { AnyRecord } from '@kikiutils/shared/types';

import type {
    SmsProviderCode,
    SmsSendRecordStatus,
} from '../../constants/sms';

import type { WithAdminAuditData } from './';

export interface SmsProviderData extends BaseMongooseModelData, WithAdminAuditData {
    apiProxyUrl?: string;
    cacheKey: string;
    code: SmsProviderCode;
    config: AnyRecord;
    enabled: boolean;
    name: string;
    priority: number;
}

export interface SmsSendRecordData extends BaseMongooseModelData {
    attemptId?: string;
    content: string;
    failureReason?: string;
    provider?: Partial<SmsProviderData>;
    providerTransactionId?: string;
    sender?: string;
    status: SmsSendRecordStatus;
    to: string;
}
