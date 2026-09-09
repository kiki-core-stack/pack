import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { CommonStatus } from '..';

export enum EmailProviderCode {
    Smtp = 0,
}

export enum EmailSenderIdentityKey {
    Admin = 0,
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
export const emailSendQueueName = 'email-send';
