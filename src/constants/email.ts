import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { CommonStatus } from './';

export enum EmailProviderCode {
    Smtp = 0,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
    // /* eslint-disable perfectionist/sort-enums */

    // /* eslint-enable perfectionist/sort-enums */
}

export enum EmailSenderIdentityKey {
    Admin = 0,

    // Values below 1000 are reserved for upstream shared base types.
    // Downstream projects must assign project-specific values starting at 1000.
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

// eslint-disable-next-line style/max-len
export const emailProviderCodeToTextMap: ReadonlyRecord<EmailProviderCode, string> = { [EmailProviderCode.Smtp]: 'SMTP' };

// eslint-disable-next-line style/max-len
export const emailSenderIdentityKeyToTextMap: ReadonlyRecord<EmailSenderIdentityKey, string> = { [EmailSenderIdentityKey.Admin]: '總後台' };
