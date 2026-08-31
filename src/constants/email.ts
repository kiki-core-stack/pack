import type { ReadonlyRecord } from '@kikiutils/shared/types';

import { CommonStatus } from './';

export enum EmailProviderCode {
    Smtp = 0,
}

export enum EmailSenderIdentityKey {
    Admin = 0,
}

export enum EmailSendRecordStatus {
    Failed = CommonStatus.Failed,
    Pending = CommonStatus.Pending,
    Processing = CommonStatus.Processing,
    Success = CommonStatus.Success,
}

// eslint-disable-next-line style/max-len
export const emailSenderIdentityKeyToTextMap: ReadonlyRecord<EmailSenderIdentityKey, string> = { [EmailSenderIdentityKey.Admin]: '總後台' };
// eslint-disable-next-line style/max-len
export const emailProviderCodeToTextMap: ReadonlyRecord<EmailProviderCode, string> = { [EmailProviderCode.Smtp]: 'SMTP' };
