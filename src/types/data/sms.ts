import type { BaseMongooseModelData } from '@kikiutils/mongoose/types/data';

import type { SmsSendRecordStatus } from '../../constants/sms';
import type { SmsProviderConfigVariant } from '../sms';

import type { WithAdminAuditData } from './';

export type SmsProviderData = SmsProviderBaseData & SmsProviderConfigVariant;

export interface SmsProviderBaseData extends BaseMongooseModelData, WithAdminAuditData {
    apiProxyUrl?: string;
    cacheKey: string;
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
