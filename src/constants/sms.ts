import type { ReadonlyRecord } from '@kikiutils/shared/types';

import type { LocalizedMessages } from '../types/i18n';

import { CommonStatus } from './';

export enum SmsProviderCode {
    Mitake = 1,
    TwSms = 0,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // Uncomment the eslint-disable/enable lines below if `eslint --fix` would reorder these values.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export enum SmsSendRecordStatus {
    DeliveryUnknown = CommonStatus.DeliveryStatusUnknown,
    Failed = CommonStatus.Failed,
    Pending = CommonStatus.Pending,
    Processing = CommonStatus.Processing,
    Succeeded = CommonStatus.Succeeded,
}

export const smsProviderCodeToLabelMap: ReadonlyRecord<SmsProviderCode, LocalizedMessages> = {
    [SmsProviderCode.Mitake]: {
        'en': 'Mitake',
        'zh-TW': '三竹簡訊',
    },
    [SmsProviderCode.TwSms]: {
        'en': 'TwSMS',
        'zh-TW': '台灣簡訊',
    },
};
