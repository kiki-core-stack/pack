import type { SentMessageInfo } from 'nodemailer/lib/sendmail-transport';

export type SendEmailResult = SendEmailErrorResult | SendEmailSuccessResult;
export type SendEmailSuccessResult = SentMessageInfo & { success: true };

export interface SendEmailErrorResult {
    error: Error;
    success: false;
}
