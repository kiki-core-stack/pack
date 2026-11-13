import type { ReadonlyRecord } from '@kikiutils/shared/types';

import type { LocalizedMessages } from '../types/i18n';

import { CommonStatus } from './';

export enum EmailProviderCode {
    Smtp = 0,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // Uncomment the eslint-disable/enable lines below if `eslint --fix` would reorder these values.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export enum EmailSenderIdentityKey {
    Admin = 0,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // Uncomment the eslint-disable/enable lines below if `eslint --fix` would reorder these values.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export enum EmailSendRecordStatus {
    DeliveryUnknown = CommonStatus.DeliveryStatusUnknown,
    Failed = CommonStatus.Failed,
    Pending = CommonStatus.Pending,
    Processing = CommonStatus.Processing,
    Succeeded = CommonStatus.Succeeded,
}

export const emailProviderCodeToLabelMap: ReadonlyRecord<EmailProviderCode, LocalizedMessages> = {
    [EmailProviderCode.Smtp]: {
        'en': 'SMTP',
        'zh-TW': 'SMTP',
    },
};

export const emailSenderIdentityKeyToLabelMap: ReadonlyRecord<EmailSenderIdentityKey, LocalizedMessages> = {
    [EmailSenderIdentityKey.Admin]: {
        'en': 'Admin management',
        'zh-TW': '總後台',
    },
};
