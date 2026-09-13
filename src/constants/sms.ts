import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { CommonStatus } from './';

export enum SmsProviderCode {
    Mitake = 1,
    TwSms = 0,
}

export enum SmsSendRecordStatus {
    DeliveryUnknown = CommonStatus.DeliveryStatusUnknown,
    Failed = CommonStatus.Failed,
    Pending = CommonStatus.Pending,
    Processing = CommonStatus.Processing,
    Succeeded = CommonStatus.Succeeded,
}

export const smsProviderCodeToTextMap: ReadonlyRecord<SmsProviderCode, string> = {
    [SmsProviderCode.Mitake]: '三竹簡訊',
    [SmsProviderCode.TwSms]: '台灣簡訊',
};
